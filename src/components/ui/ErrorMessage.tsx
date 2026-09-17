interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-clay/20 bg-clay/5 p-4 text-sm text-clay" role="alert">
      <div className="flex items-center justify-between gap-3">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-[6px] border border-clay/30 px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay/10 transition-colors min-h-[36px]"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
