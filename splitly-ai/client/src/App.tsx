import { useState, useCallback } from 'react';
import type { AppState, Bill, ExtractionResponse } from './types/bill';
import ImageUploader from './components/ImageUploader';
import ExtractionStatus from './components/ExtractionStatus';
import BillPreview from './components/BillPreview';

function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractedBill, setExtractedBill] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setAppState('preview');
    setError(null);
    setExtractedBill(null);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return;

    setAppState('extracting');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('billImage', selectedFile);

      const response = await fetch('/api/extract-bill', {
        method: 'POST',
        body: formData,
      });

      const result: ExtractionResponse = await response.json();

      if (result.success) {
        setExtractedBill(result.data);
        setAppState('result');
      } else {
        setError(result.details || result.error);
        setAppState('error');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to the extraction service'
      );
      setAppState('error');
    }
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    setAppState(selectedFile ? 'preview' : 'idle');
    setError(null);
    setExtractedBill(null);
  }, [selectedFile]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setExtractedBill(null);
    setError(null);
    setAppState('idle');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍽️</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SplitLy <span className="text-brand-500">AI</span>
              </h1>
              <p className="text-sm text-gray-500">Smart restaurant bill splitter</p>
            </div>
          </div>
          {appState !== 'idle' && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              ← New Bill
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Upload / Preview States */}
        {(appState === 'idle' || appState === 'preview') && (
          <div className="space-y-6">
            <ImageUploader
              onFileSelect={handleFileSelect}
              previewUrl={imagePreviewUrl}
              fileName={selectedFile?.name ?? null}
            />
            {appState === 'preview' && (
              <div className="flex justify-center">
                <button
                  onClick={handleExtract}
                  className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-all shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Extract Bill with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Extracting State */}
        {appState === 'extracting' && (
          <ExtractionStatus
            status="loading"
            imageUrl={imagePreviewUrl}
          />
        )}

        {/* Error State */}
        {appState === 'error' && (
          <ExtractionStatus
            status="error"
            errorMessage={error ?? 'Unknown error occurred'}
            onRetry={handleRetry}
            imageUrl={imagePreviewUrl}
          />
        )}

        {/* Result State */}
        {appState === 'result' && extractedBill && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Extracted Bill Data</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Review the extracted data below. This data has not been used for any calculations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image thumbnail */}
              {imagePreviewUrl && (
                <div className="lg:col-span-1">
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded bill"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Bill preview */}
              <div className={imagePreviewUrl ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <BillPreview bill={extractedBill} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
          SplitLy AI — Powered by Gemini Vision · Phase 1: Extraction Preview
        </div>
      </footer>
    </div>
  );
}

export default App;
