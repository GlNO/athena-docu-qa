import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import './FileUpload.css';
import addIcon from '../../assets/images/add.png';
import clipIcon from '../../assets/images/clip.png';
import owlIcon from '../../assets/images/owl_icon_.png';
import {
  searchDocument,
  uploadDocument,
  type SearchResponse,
  type UploadResponse,
} from '../../api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<UploadResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [askedQuestion, setAskedQuestion] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchResponse || isSearching) {
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [isSearching, searchResponse]);

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
    setQuestion('');
    setAskedQuestion('');
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
    const submittedQuestion = question.trim();
    setAskedQuestion(submittedQuestion);

    try {
      const response = await searchDocument(document.document_id, submittedQuestion);
      setSearchResponse(response);
      setQuestion('');
    } catch (searchError) {
      setAskedQuestion('');
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
      <div className="file-upload-eyebrow" aria-label="Athena, knowledge within reach">
        <strong>Athena</strong>
        <span>Knowledge, within reach.</span>
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
          {!document && !isUploading && (
            <div className="file-upload-prompt">
              <img src={owlIcon} alt="" className="file-upload-logo" />
              <h2 id="file-upload-title">What would you like to know?</h2>
              <p>Attach a PDF to get the conversation started.</p>
            </div>
          )}

          {isUploading && (
            <div className="file-upload-typing file-upload-uploading" role="status">
              <img src={owlIcon} alt="" className="file-upload-typing-logo" />
              <span>Reading your document</span>
              <span
                className="file-upload-typing-dots"
                aria-label="Athena is reading your document"
              >
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {document && (
            <div
              ref={conversationRef}
              className="file-upload-conversation"
              aria-live="polite"
            >
              <p className="file-upload-success" role="status">
                {document.message}
              </p>
              {askedQuestion && (
                <div className="file-upload-message file-upload-message-user">
                  <span className="file-upload-message-label">You</span>
                  <p>{askedQuestion}</p>
                </div>
              )}
              {isSearching && (
                <div className="file-upload-typing" role="status">
                  <img src={owlIcon} alt="" className="file-upload-typing-logo" />
                  <span>Thinking through your document</span>
                  <span className="file-upload-typing-dots" aria-label="Athena is thinking">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              )}
              {searchResponse && (
                <div className="file-upload-message file-upload-message-assistant">
                  <span className="file-upload-message-label">Athena</span>
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
          )}

          <input
            ref={inputRef}
            className="file-upload-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
          />
          <div className="file-upload-composer">
            <div className="file-upload-attachment-row">
              <button
                className="file-upload-attach"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <img src={clipIcon} alt="" />
                <span>{selectedFile?.name ?? 'Attach a PDF'}</span>
              </button>
              <button
                className="file-upload-add"
                type="button"
                aria-label="Choose a PDF file"
                onClick={() => inputRef.current?.click()}
              >
                <img src={addIcon} alt="" />
              </button>
            </div>

            <div className="file-upload-divider" />

            <textarea
              className="file-upload-question-input"
              aria-label="Ask Athena a question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask Athena a question..."
              rows={1}
              maxLength={2000}
              disabled={!document}
            />

            {selectedFile && !document && (
              <button
                className="file-upload-submit"
                type="button"
                disabled={isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    Uploading <span className="file-upload-spinner" aria-hidden="true" />
                  </>
                ) : (
                  'Upload PDF'
                )}
              </button>
            )}

            {document && (
              <button
                className="file-upload-submit"
                type="button"
                disabled={!question.trim() || isSearching}
                onClick={handleSearch}
              >
                {isSearching ? (
                  <>
                    Searching <span className="file-upload-spinner" aria-hidden="true" />
                  </>
                ) : (
                  'Ask question'
                )}
              </button>
            )}
          </div>
        </div>


        {error && (
          <p className="file-upload-error" role="alert">
            {error}
          </p>
        )}

      </div>
    </section>
  );
}