import json
from collections.abc import Iterator
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:3b-instruct"

SYS_PROMPT = """
You are Athena, a document question-answering assistant.

RULES:
1. Answer the user's question using ONLY the supplied document excerpts. Do not use any external knowledge or information.
2. Treat document excerpts as the ground truth. If the excerpts do not contain enough information to answer the question, respond with: "I couldn't find enough information in this document to answer that."
3. Cite supporting evidence using [Page N], based only on the supplied page numbers.
4. Do not invent facts or use outside knowledge to fill gaps.
5. If the excerpts provide only a partial answer, answer the supported
   portion and clearly state what information is missing.
6. If the excerpts contain no relevant information or cannot support
   an answer, respond exactly:
   "I couldn't find enough information in this document to answer that."
7. Keep answers clear, concise, and directly relevant to the question.


"""

GENERAL_SYS_PROMPT = """
You are Athena, a helpful conversational assistant.

RULES:
1. Answer the user's question clearly and directly.
2. Do not claim to have access to a document unless the user supplied one.
3. If the question requires information you do not have, say so clearly rather
   than inventing facts.
4. Keep answers concise and directly relevant to the question.
"""

def _generate_answer(
    question: str,
    system_prompt: str,
    excerpts: str = "",
) -> str:
    prompt = f"QUESTION:\n{question}"
    if excerpts:
        prompt = f"DOCUMENT EXCERPTS:\n{excerpts}\n\n{prompt}"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
        },
    }

    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))

    except HTTPError as exc:
        raise RuntimeError(
            f"Ollama returned HTTP {exc.code}."
        ) from exc
    except URLError as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Make sure Ollama is running."
        ) from exc

    answer = result.get("message", {}).get("content", "")

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("Ollama returned an empty answer.")

    return answer.strip()


def generate_answer(question: str, chunks: list[dict]) -> str:
    if not chunks:
        return (
            "I couldn't find enough information in this document to answer that."
        )

    excerpts = "\n\n".join(
        f"[Page {chunk['page_number']}]\n{chunk['text']}"
        for chunk in chunks
    )
    return _generate_answer(question, SYS_PROMPT, excerpts)


def generate_general_answer(question: str) -> str:
    return _generate_answer(question, GENERAL_SYS_PROMPT)


def stream_answer(
    question: str,
    chunks: list[dict] | None = None,
) -> Iterator[str]:
    system_prompt = GENERAL_SYS_PROMPT
    excerpts = ""

    if chunks is not None:
        system_prompt = SYS_PROMPT
        excerpts = "\n\n".join(
            f"[Page {chunk['page_number']}]\n{chunk['text']}"
            for chunk in chunks
        )

    prompt = f"QUESTION:\n{question}"
    if excerpts:
        prompt = f"DOCUMENT EXCERPTS:\n{excerpts}\n\n{prompt}"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
        "options": {
            "temperature": 0.1,
        },
    }

    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=180) as response:
            for line in response:
                if not line.strip():
                    continue

                result = json.loads(line.decode("utf-8"))
                content = result.get("message", {}).get("content", "")
                if isinstance(content, str) and content:
                    yield content
    except HTTPError as exc:
        raise RuntimeError(f"Ollama returned HTTP {exc.code}.") from exc
    except URLError as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Make sure Ollama is running."
        ) from exc