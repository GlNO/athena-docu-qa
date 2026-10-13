import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import './FileUpload.css';
import {
  searchDocument,
  uploadDocument,
  type SearchResponse,
  type UploadResponse,
} from '../../api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<UploadResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);

  const selectFile = (file: File | undefined) => {
    setError('');

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null);
      setError('Please choose a PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError('The PDF must be 10 MB or smaller.');
      return;
    }

    setSelectedFile(file);
    setDocument(null);
    setSearchResponse(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      setDocument(await uploadDocument(selectedFile));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'The PDF could not be uploaded.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!document || !question.trim()) {
      return;
    }

    setError('');
    setIsSearching(true);

    try {
      setSearchResponse(await searchDocument(document.document_id, question.trim()));
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'The question could not be answered.',
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="file-upload" id="upload-pdf" aria-labelledby="file-upload-title">
      <div className="file-upload-content">
        <div className="file-upload-heading">
    
          <h2 id="file-upload-title">Choose a document to start asking questions.</h2>
        </div>
     
        <div      
          className={`file-upload-dropzone${isDragging ? ' is-dragging' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className="file-upload-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
          />
          <h2
            className="file-upload-text"
        
            onClick={() => inputRef.current?.click()}
          >


            Drop your PDF here
          </h2>
          <span>or browse files from your device.</span>

            
        {selectedFile && (
          <p className="file-upload-selected" role="status">
            <strong>{selectedFile.name}</strong>
          </p>
        )}


          <button
            className="file-upload-submit"
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? 'Uploading...' : 'Upload PDF'}
          </button>

        
        </div>


        {error && (
          <p className="file-upload-error" role="alert">
            {error}
          </p>
        )}

        {document && (
          <div className="file-upload-question">
            <p className="file-upload-success" role="status">
              {document.message}
            </p>
            <label htmlFor="document-question">Ask a question about your PDF</label>
            <textarea
              id="document-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What would you like to know?"
              rows={3}
              maxLength={2000}
            />
            <button
              className="file-upload-submit"
              type="button"
              disabled={!question.trim() || isSearching}
              onClick={handleSearch}
            >
              {isSearching ? 'Searching...' : 'Ask question'}
            </button>
          </div>
        )}

        {searchResponse && (
          <div className="file-upload-results" aria-live="polite">
            <h3>
              {searchResponse.result_count
                ? 'Relevant passages'
                : 'No relevant passages found'}
            </h3>
            {searchResponse.results.map((result) => (
              <article
                className="file-upload-result"
                key={`${result.page_number}-${result.chunk_index}`}
              >
                <p>{result.text}</p>
                <small>Page {result.page_number}</small>
              </article>
            ))}
          </div>
        )}

      
      </div>
    </section>
  );
}