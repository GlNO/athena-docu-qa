const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

type ApiError = {
  detail?: string;
};

export type UploadResponse = {
  document_id: string;
  filename: string;
  page_count: number;
  total_characters: number;
  chunk_count: number;
  stored_chunks: number;
  message: string;
};

export type SearchResult = {
  text: string;
  page_number: number;
  chunk_index: number;
  distance: number;
};

export type SearchResponse = {
  document_id: string;
  question: string;
  results: SearchResult[];
  result_count: number;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${url}`, init);
  } catch {
    throw new Error(
      'Unable to connect to Athena. Make sure the backend is running on port 8000.',
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(error?.detail ?? `The request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return request<UploadResponse>('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export function searchDocument(
  documentId: string,
  question: string,
): Promise<SearchResponse> {
  return request<SearchResponse>(
    `/api/documents/${encodeURIComponent(documentId)}/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    },
  );
}
