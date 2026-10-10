import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import './FileUpload.css';


const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
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


          <button className="file-upload-submit" type="button" disabled={!selectedFile}>
          Upload PDF
        </button>

        
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