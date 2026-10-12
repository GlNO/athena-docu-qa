
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pydantic import BaseModel, Field

from app.services.pdf_services import extract_pdf_text
from app.services.chunking_service import chunk_pages
from app.db.vector_store import store_chunks, search_chunks



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