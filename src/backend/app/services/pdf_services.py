
import pymupdf


def extract_pdf_text(pdf_bytes: bytes) -> list[dict]:
    """Extract text from a PDF while preserving page numbers."""

    try:
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as document:
            if document.needs_pass:
                raise ValueError("Password-protected PDFs are not supported yet.")

            pages = []

            for page_number, page in enumerate(document, start=1):
                pages.append(
                    {
                        "page_number": page_number,
                        "text": page.get_text("text").strip(),
                    }
                )

            return pages

    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("The uploaded file could not be read as a valid PDF.") from exc
