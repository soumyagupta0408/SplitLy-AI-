interface ExtractionStatusProps {
  status: 'loading' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  imageUrl?: string | null;
}

export default function ExtractionStatus({
  status,
  errorMessage,
  onRetry,
  imageUrl,
}: ExtractionStatusProps) {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Processing bill"
            className="w-48 h-auto rounded-lg shadow-md opacity-60"
          />
        )}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">Analyzing your bill...</p>
            <p className="text-sm text-gray-400 mt-1">
              Gemini AI is extracting items, prices, and charges
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div className="text-center max-w-md">
        <p className="text-lg font-medium text-gray-900">Extraction Failed</p>
        <p className="text-sm text-gray-500 mt-2">{errorMessage}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
