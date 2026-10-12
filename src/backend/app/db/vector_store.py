
from pathlib import Path
from uuid import uuid4

import chromadb

from app.services.embedding_service import embed_texts


DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "chroma"

client = chromadb.PersistentClient(path=str(DATA_DIR))

collection = client.get_or_create_collection(
    name="athena_documents",
    metadata={"hnsw:space": "cosine"},
)


def store_chunks(document_id: str, chunks: list[dict]) -> int:
    """Embed and store a document's chunks in ChromaDB."""
    if not chunks:
        return 0

    texts = [chunk["text"] for chunk in chunks]
    embeddings = embed_texts(texts)

    collection.add(
        ids=[
            f"{document_id}-{chunk['page_number']}-"
            f"{chunk['chunk_index']}-{uuid4().hex[:8]}"
            for chunk in chunks
        ],
        documents=texts,
        embeddings=embeddings,
        metadatas=[
            {
                "document_id": document_id,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
            }
            for chunk in chunks
        ],
    )

    return len(chunks)


def search_chunks(
    document_id: str,
    question: str,
    top_k: int = 5,
) -> list[dict]:
    """Retrieve the most relevant chunks from one document."""
    if not question.strip():
        return []

    if top_k < 1:
        raise ValueError("top_k must be at least 1.")

    if collection.count() == 0:
        return []

    query_embedding = embed_texts([question])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        where={"document_id": document_id},
        include=["documents", "metadatas", "distances"],
    )

    matches = []

    for text, metadata, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        matches.append(
            {
                "text": text,
                "page_number": metadata["page_number"],
                "chunk_index": metadata["chunk_index"],
                "distance": distance,
            }
        )

    return matches
