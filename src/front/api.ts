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

export type Source = {
  text: string;
  page_number: number;
  chunk_index: number;
};

export type ChatResponse = {
  document_id: string | null;
  question: string;
  answer: string;
  sources: Source[];
};

type ChatStreamEvent =
  | {
      type: 'metadata';
      document_id: string | null;
      question: string;
      sources: Source[];
    }
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; detail: string };

type ChatMetadata = {
  document_id: string | null;
  question: string;
  sources: Source[];
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

export function chatDocument(
  documentId: string,
  question: string,
): Promise<ChatResponse> {
  return request<ChatResponse>(
    `/api/documents/${encodeURIComponent(documentId)}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    },
  );
}

export function chatWithAthena(question: string): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
}

async function streamChat(
  url: string,
  question: string,
  onChunk: (content: string) => void,
): Promise<ChatResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ question }),
    });
  } catch {
    throw new Error(
      'Unable to connect to Athena. Make sure the backend is running on port 8000.',
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(error?.detail ?? `The request failed (${response.status}).`);
  }

  if (!response.body) {
    throw new Error('Athena returned an empty response.');
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let metadata: ChatMetadata = {
    document_id: null,
    question: '',
    sources: [],
  };
  let hasMetadata = false;
  let answer = '';

  const processEvent = (eventText: string) => {
    const eventName = eventText
      .split('\n')
      .find((line) => line.startsWith('event: '))
      ?.slice(7);
    const data = eventText
      .split('\n')
      .find((line) => line.startsWith('data: '));
    if (!eventName || !data) {
      return;
    }

    const payload = JSON.parse(data.slice(6)) as Omit<
      Extract<ChatStreamEvent, { type: 'metadata' }>,
      'type'
    > & Partial<Extract<ChatStreamEvent, { type: 'chunk' }>>;
    if (eventName === 'metadata') {
      metadata = {
        document_id: payload.document_id ?? null,
        question: payload.question ?? '',
        sources: payload.sources ?? [],
      };
      hasMetadata = true;
    } else if (eventName === 'chunk' && payload.content) {
      answer += payload.content;
      onChunk(answer);
    } else if (eventName === 'error') {
      const error = payload as { detail?: string };
      throw new Error(error.detail ?? 'Athena could not generate an answer.');
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += value ?? '';

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      processEvent(buffer.slice(0, separatorIndex));
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      break;
    }
  }

  if (!hasMetadata) {
    throw new Error('Athena returned an incomplete response.');
  }

  return {
    document_id: metadata.document_id,
    question: metadata.question,
    sources: metadata.sources,
    answer,
  };
}

export function streamChatDocument(
  documentId: string,
  question: string,
  onChunk: (content: string) => void,
): Promise<ChatResponse> {
  return streamChat(
    `/api/documents/${encodeURIComponent(documentId)}/chat/stream`,
    question,
    onChunk,
  );
}

export function streamChatWithAthena(
  question: string,
  onChunk: (content: string) => void,
): Promise<ChatResponse> {
  return streamChat('/api/chat/stream', question, onChunk);
}
