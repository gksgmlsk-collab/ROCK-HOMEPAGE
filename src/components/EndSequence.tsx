import { ending } from '../data/scenes';

type EndSequenceProps = {
  timelineTime: number;
};

export function EndBrand() {
  return (
    <div className="end-brand">
      <svg
        className="end-brand__mark"
        viewBox="0 0 96 96"
        aria-hidden="true"
      >
        <path
          d="M20 67V46m18 21V31m19 36V40m19 27V24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <circle cx="20" cy="39" r="7" fill="currentColor" />
        <circle cx="38" cy="24" r="7" fill="currentColor" />
        <circle cx="57" cy="33" r="7" fill="currentColor" />
        <circle cx="76" cy="17" r="7" fill="currentColor" />
      </svg>
      <div className="end-brand__wordmark">
        <strong>돌 AI연구소</strong>
        <span>DOL AI LAB</span>
      </div>
      <p>AI for Education, Together.</p>
    </div>
  );
}

export function EndSequence({ timelineTime }: EndSequenceProps) {
  if (timelineTime < ending.startTime) return null;

  const stage =
    timelineTime < ending.firstMessageEnd
      ? 0
      : timelineTime < ending.secondMessageEnd
        ? 1
        : 2;

  return (
    <section className="end-sequence" aria-live="polite">
      <div className="end-sequence__wash" />
      {stage < 2 ? (
        <p className="end-sequence__message" key={`message-${stage}`}>
          {ending.messages[stage]}
        </p>
      ) : (
        <EndBrand key="ending-logo" />
      )}
    </section>
  );
}
