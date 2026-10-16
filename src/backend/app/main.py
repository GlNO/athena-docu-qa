
import json
from collections.abc import Iterator

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from uuid import uuid4
from pydantic import BaseModel, Field


from app.services.llm_service import (
    generate_answer,
    generate_general_answer,
    stream_answer,
)
from app.services.pdf_services import extract_pdf_text
from app.services.chunking_service import chunk_pages
from app.db.vector_store import store_chunks, search_chunks


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


class SearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


app = FastAPI(
    title="Athena API",
    description="Backend API for Athena's document Q&A system.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Athena API is running",
    }




@app.post("/api/documents/{document_id}/search")
def search_document(document_id: str, request: SearchRequest):

    matches = search_chunks(
        document_id=document_id,
        question=request.question,
        top_k=request.top_k,

        
    )
        
    


        

    return {
        "document_id": document_id,
        "question": request.question,
        "results": matches,
        "result_count": len(matches),

        

    }

@app.post("/api/documents/{document_id}/chat")
def chat_document(document_id: str, request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    matches = search_chunks(
        document_id=document_id,
        question=question,
        top_k=request.top_k,
    )

    print("\n--- RETRIEVED CHUNKS (chat_document) ---")
    print(matches)
    print("--- END RETRIEVED CHUNKS ---\n")

   

    if not matches:
        return {
            "document_id": document_id,
            "question": question,
            "answer": (
                "I couldn't find enough information in this document "
                "to answer that."
            ),
            "sources": [],
        }

    try:
        answer = generate_answer(
            question=question,
            chunks=matches,
        )
    except Exception as exc:
        # Log the actual error in the backend terminal for debugging.
        print(f"Answer generation failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Athena couldn't generate an answer. "
                   "Check that Ollama is running and try again.",
        ) from exc

    sources = [
        {
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"],
        }
        for chunk in matches
    ]

    return {
        "document_id": document_id,
        "question": question,
        "answer": answer,
        "sources": sources,
    }


@app.post("/api/chat")
def chat_without_document(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    try:
        answer = generate_general_answer(question)
    except Exception as exc:
        print(f"Answer generation failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Athena couldn't generate an answer. "
                   "Check that Ollama is running and try again.",
        ) from exc

    return {
        "document_id": None,
        "question": question,
        "answer": answer,
        "sources": [],
    }


def _sse_event(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


def _stream_chat_response(
    question: str,
    document_id: str | None,
    chunks: list[dict] | None,
) -> Iterator[str]:
    sources = [
        {
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"],
        }
        for chunk in chunks or []
    ]
    yield _sse_event(
        "metadata",
        {
            "document_id": document_id,
            "question": question,
            "sources": sources,
        },
    )

    if chunks is not None and not chunks:
        yield _sse_event(
            "chunk",
            {
                "content": (
                    "I couldn't find enough information in this document "
                    "to answer that."
                ),
            },
        )
    else:
        try:
            for content in stream_answer(question, chunks):
                yield _sse_event("chunk", {"content": content})
        except Exception as exc:
            print(f"Streaming answer generation failed: {exc}")
            yield _sse_event(
                "error",
                {
                    "detail": (
                        "Athena couldn't generate an answer. "
                        "Check that Ollama is running and try again."
                    ),
                },
            )
            return

    yield _sse_event("done", {})


@app.post("/api/documents/{document_id}/chat/stream")
def stream_document_chat(document_id: str, request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    matches = search_chunks(
        document_id=document_id,
        question=question,
        top_k=request.top_k,
    )

    print("\n--- RETRIEVED CHUNKS (chat_document) ---")
    print(matches)
    print("--- END RETRIEVED CHUNKS ---\n")
    
    return StreamingResponse(
        _stream_chat_response(question, document_id, matches),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/chat/stream")
def stream_general_chat(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    return StreamingResponse(
        _stream_chat_response(question, None, None),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/documents/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    pdf_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The PDF must be 10 MB or smaller.",
        )

    if b"%PDF-" not in pdf_bytes[:1024]:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    try:
        pages = extract_pdf_text(pdf_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    total_characters = sum(len(page["text"]) for page in pages)
    chunks = chunk_pages(pages)
    document_id = uuid4().hex
    stored_count = store_chunks(document_id, chunks)

    return {
    "document_id": document_id,
    "filename": file.filename,
    "page_count": len(pages),
    "total_characters": total_characters,
    "chunk_count": len(chunks),
    "stored_chunks": stored_count,
    "message": (
        "PDF processed and indexed successfully."
        if stored_count > 0
        else "PDF opened, but no extractable text was found."
    ),
}