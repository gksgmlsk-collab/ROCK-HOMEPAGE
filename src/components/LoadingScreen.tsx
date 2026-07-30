type LoadingScreenProps = {
  isLoading: boolean;
  progress: number | null;
  error: string | null;
};

export function LoadingScreen({
  isLoading,
  progress,
  error,
}: LoadingScreenProps) {
  if (!isLoading && !error) return null;

  const percent =
    progress === null ? null : Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div
      className={`load-status${error ? ' load-status--fallback' : ''}`}
      role="status"
      aria-live="polite"
      title={error ?? undefined}
    >
      <span className="load-status__mark" aria-hidden="true" />
      <span>
        {error
          ? '원본 장면으로 탐험 중'
          : `여정을 준비하는 중${percent === null ? '' : ` · ${percent}%`}`}
      </span>
    </div>
  );
}
