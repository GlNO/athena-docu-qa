
def chunk_pages(
    pages: list[dict],
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list[dict]:
    """Split extracted PDF pages into overlapping text chunks."""

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and smaller than chunk_size.")

    chunks = []

    for page in pages:
        text = page["text"].strip()
        page_number = page["page_number"]

        if not text:
            continue

        start = 0
        chunk_index = 0

        while start < len(text):
            end = min(start + chunk_size, len(text))

            # Prefer a natural break near the end of the chunk.
            if end < len(text):
                minimum_break = start + int(chunk_size * 0.75)
                candidates = [
                    text.rfind("\n", minimum_break, end),
                    text.rfind(". ", minimum_break, end),
                    text.rfind(" ", minimum_break, end),
                ]
                best_break = max(candidates)

                if best_break > start:
                    end = best_break + 1

            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append(
                    {
                        "page_number": page_number,
                        "chunk_index": chunk_index,
                        "text": chunk_text,
                    }
                )
                chunk_index += 1

            if end >= len(text):
                break

            start = end - overlap

    return chunks
