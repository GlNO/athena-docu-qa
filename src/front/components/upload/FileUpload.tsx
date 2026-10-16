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
  streamChatWithAthena,
  streamChatDocument,
  uploadDocument,
  type ChatResponse,
  type UploadResponse,
} from '../../api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const sourceViewRef = useRef<HTMLDivElement>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<UploadResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [askedQuestion, setAskedQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(
    null,
  );
  const [isChatting, setIsChatting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedSourcePage, setSelectedSourcePage] = useState<number | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const clearPdfPreview = () => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    setPdfUrl(null);
  };

  useEffect(() => {
    if (chatResponse || isChatting) {
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [isChatting, chatResponse]);

  const selectFile = (file: File | undefined) => {
    setError('');

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      clearPdfPreview();
      setSelectedFile(null);
      setError('Please choose a PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      clearPdfPreview();
      setSelectedFile(null);
      setError('The PDF must be 10 MB or smaller.');
      return;
    }

    clearPdfPreview();
    const objectUrl = URL.createObjectURL(file);
    pdfUrlRef.current = objectUrl;
    setPdfUrl(objectUrl);
    setSelectedFile(file);
    setDocument(null);
    setQuestion('');
    setAskedQuestion('');
    setChatResponse(null);
    setSelectedSourcePage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const clearSelectedFile = () => {
    clearPdfPreview();
    setSelectedFile(null);
    setDocument(null);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
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

  const handleChat = async () => {
    if (!question.trim()) {
      return;
    }

    setError('');
    setIsChatting(true);
    const submittedQuestion = question.trim();
    setAskedQuestion(submittedQuestion);

    try {
      const response = document
        ? await streamChatDocument(
            document.document_id,
            submittedQuestion,
            (answer) => {
              setChatResponse({
                document_id: document.document_id,
                question: submittedQuestion,
                answer,
                sources: [],
              });
            },
          )
        : await streamChatWithAthena(submittedQuestion, (answer) => {
            setChatResponse({
              document_id: null,
              question: submittedQuestion,
              answer,
              sources: [],
            });
          });
      setChatResponse(response);
      setSelectedSourcePage(response.sources[0]?.page_number ?? null);
      setQuestion('');
    } catch (chatError) {
      setAskedQuestion('');
      setError(
        chatError instanceof Error
          ? chatError.message
          : 'The question could not be answered.',
      );
    } finally {
      setIsChatting(false);
    }
  };

  const handleSourcePageChange = (pageNumber: number) => {
    setSelectedSourcePage(pageNumber);
    requestAnimationFrame(() => {
      sourceViewRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  };

  return (
  <section className="file-upload" id="upload-pdf" aria-labelledby="file-upload-title">
    <div className="file-upload-content">
      <div className="file-upload-header">
        <div>
          <p className="file-upload-kicker">Document workspace</p>
          <h1 id="file-upload-title">Make sense of your documents.</h1>
          <p className="file-upload-intro">
            Ask a question, or add a PDF to get answers grounded in the pages that matter.
          </p>
        </div>
       
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
          {!document && !askedQuestion && !isChatting && (
            <div className="file-upload-prompt">
              <img src={owlIcon} alt="" className="file-upload-logo" />
              <h2>What would you like to know?</h2>
              <p>Ask Athena anything, or attach a PDF for document-grounded answers.</p>
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

          {(document || askedQuestion || isChatting) && (
            <div
              ref={conversationRef}
              className="file-upload-conversation"
              aria-live="polite"
            >
              {document && (
                <p className="file-upload-success" role="status">
                  {document.message}
                </p>
              )}
              {askedQuestion && (
                <div className="file-upload-message file-upload-message-user">
                  <p>{askedQuestion}</p>
                </div>
              )}
              {isChatting && (
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
              {chatResponse && (
                <div className="file-upload-message file-upload-message-assistant">
                  <span className="file-upload-message-label">Athena</span>
                  <p className="file-upload-answer">{chatResponse.answer}</p>
                  {chatResponse.sources.length > 0 && (
                    <div className="file-upload-sources" aria-label="Document sources">
                      <h3>Referenced pages</h3>
                      <div className="file-upload-page-tabs" role="tablist">
                        {[...new Set(
                          chatResponse.sources.map((source) => source.page_number),
                        )].map((pageNumber) => (
                          <button
                            className={`file-upload-page-tab${
                              selectedSourcePage === pageNumber ? ' is-selected' : ''
                            }`}
                            key={pageNumber}
                            type="button"
                            role="tab"
                            aria-selected={selectedSourcePage === pageNumber}
                            onClick={() => handleSourcePageChange(pageNumber)}
                          >
                            Page {pageNumber}
                          </button>
                        ))}
                      </div>
                      {selectedSourcePage && (
                        <div
                          ref={sourceViewRef}
                          className="file-upload-source-view"
                        >
                          <div className="file-upload-source-excerpt">
                            <span className="file-upload-source-label">
                              From page {selectedSourcePage}
                            </span>
                            <p>
                              {chatResponse.sources.find(
                                (source) => source.page_number === selectedSourcePage,
                              )?.text}
                            </p>
                          </div>
                          {pdfUrl && (
                            <div className="file-upload-page-preview">
                              <iframe
                                key={selectedSourcePage}
                                src={`${pdfUrl}#page=${selectedSourcePage}`}
                                title={`PDF page ${selectedSourcePage}`}
                              />
                              <a
                                href={`${pdfUrl}#page=${selectedSourcePage}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open full PDF
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
            {!selectedFile && !document ? (
              <button
                className={`file-upload-upload-area${isDragging ? ' is-dragging' : ''}`}
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <span className="file-upload-upload-icon">
                  <img src={clipIcon} alt="" />
                </span>
                <span className="file-upload-upload-copy">
                  <strong>Add a PDF</strong>
                  <span>Drop it here or browse your files</span>
                </span>
                <span className="file-upload-upload-meta">PDF · up to 10 MB</span>
              </button>
            ) : (
              <div className="file-upload-attachment-row">
                <div className="file-upload-file">
                  <span className="file-upload-file-icon">
                    <img src={clipIcon} alt="" />
                  </span>
                  <span className="file-upload-file-copy">
                    <strong>{selectedFile?.name ?? 'Document ready'}</strong>
                    <span>{document ? 'Ready for questions' : 'PDF selected'}</span>
                  </span>
                </div>
                {!document && (
                  <button
                    className="file-upload-add"
                    type="button"
                    aria-label="Replace selected PDF"
                    onClick={() => inputRef.current?.click()}
                  >
                    <img src={addIcon} alt="" />
                  </button>
                )}
                {selectedFile && !document && (
                  <button
                    className="file-upload-remove"
                    type="button"
                    onClick={clearSelectedFile}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            <div className="file-upload-divider" />

            <textarea
              className="file-upload-question-input"
              aria-label="Ask Athena a question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask Athena a question..."
              rows={1}
              maxLength={2000}
              disabled={isUploading || isChatting}
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

            <button
              className="file-upload-submit"
              type="button"
              disabled={!question.trim() || isChatting || isUploading}
              onClick={handleChat}
            >
              {isChatting ? (
                <>
                  Thinking <span className="file-upload-spinner" aria-hidden="true" />
                </>
              ) : (
                document ? 'Ask question' : 'Ask Athena'
              )}
            </button>
            <span className="file-upload-hint">PDFs up to 10 MB · Answers stay grounded in your source</span>
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