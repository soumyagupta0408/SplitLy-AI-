import { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  fileName: string | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.heic,.heif';

export default function ImageUploader({ onFileSelect, previewUrl, fileName }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setFileError(null);

      // Check type — also allow by extension for HEIC which may have generic mimetype
      const ext = file.name.toLowerCase().split('.').pop();
      const validExt = ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(ext || '');
      const validType = ACCEPTED_TYPES.includes(file.type);

      if (!validType && !validExt) {
        setFileError(`Unsupported file type. Please upload JPG, PNG, or HEIC images.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setFileError('File is too large. Maximum size is 10 MB.');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const isHeic = fileName?.toLowerCase().endsWith('.heic') || fileName?.toLowerCase().endsWith('.heif');

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive
            ? 'border-brand-500 bg-brand-50 scale-[1.01]'
            : previewUrl
              ? 'border-gray-300 bg-white'
              : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleChange}
          className="hidden"
        />

        {previewUrl && !isHeic ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Bill preview"
              className="max-h-80 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{fileName}</span>
              {' · '}
              Click or drag to replace
            </p>
          </div>
        ) : previewUrl && isHeic ? (
          <div className="space-y-4">
            <div className="w-40 h-40 mx-auto rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">📄</span>
                <p className="text-xs text-gray-500 mt-2">HEIC Preview</p>
                <p className="text-xs text-gray-400">Not supported in browser</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{fileName}</span>
              {' · '}
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">Upload your restaurant bill</p>
              <p className="text-sm text-gray-400 mt-1">
                Drag & drop or click to browse · JPG, PNG, HEIC · Max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {fileError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {fileError}
        </div>
      )}
    </div>
  );
}
