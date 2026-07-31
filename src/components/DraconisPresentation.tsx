import { useState } from 'react';

const presentation = {
  href: '/assets/lab/draconis-presentation-2026-07-31.ppsm',
  downloadName: 'draconis-presentation(2026.07.31).ppsm',
};

const presentationSlides = Array.from({ length: 18 }, (_, index) => ({
  src: `/assets/lab/draconis-presentation/slides/slide-${String(index + 1).padStart(2, '0')}.jpg`,
  number: index + 1,
}));

export function DraconisPresentation() {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = presentationSlides[activeSlide];

  const showPreviousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? presentationSlides.length - 1 : current - 1,
    );
  };

  const showNextSlide = () => {
    setActiveSlide((current) => (current + 1) % presentationSlides.length);
  };

  return (
    <section
      className="draconis-presentation"
      aria-labelledby="draconis-presentation-title"
    >
      <div className="draconis-presentation__header">
        <div className="draconis-presentation__copy">
          <p className="draconis-presentation__eyebrow">POWERPOINT SHOW</p>
          <h3 id="draconis-presentation-title">드라코니스 프레젠테이션</h3>
          <p>
            원본 슬라이드 18장을 홈페이지에서 바로 넘겨볼 수 있습니다. 원본
            애니메이션은 PPSM을 내려받아 PowerPoint 슬라이드 쇼로 실행해 주세요.
          </p>
          <span>웹 슬라이드 미리보기 · PPSM 원본 약 56MB</span>
        </div>

        <div
          className="draconis-presentation__actions"
          aria-label="드라코니스 프레젠테이션"
        >
          <a
            href={presentation.href}
            download={presentation.downloadName}
            type="application/vnd.ms-powerpoint.slideshow.macroEnabled.12"
          >
            <span aria-hidden="true">↓</span>
            PPSM 원본 내려받기
          </a>
          <button
            type="button"
            className="is-placeholder"
            disabled
            title="추가 영상은 추후 연결됩니다."
          >
            추가 영상 준비 중
          </button>
        </div>
      </div>

      <div className="draconis-presentation__viewer">
        <div
          className="draconis-presentation__stage"
          aria-live="polite"
          aria-label={`드라코니스 프레젠테이션 ${currentSlide.number}번 슬라이드`}
        >
          <img
            src={currentSlide.src}
            alt={`드라코니스 프레젠테이션 ${currentSlide.number}번 슬라이드`}
          />
          <span className="draconis-presentation__counter">
            {currentSlide.number} / {presentationSlides.length}
          </span>
          <button
            type="button"
            className="draconis-presentation__nav draconis-presentation__nav--previous"
            onClick={showPreviousSlide}
            aria-label="이전 프레젠테이션 슬라이드"
          >
            ←
          </button>
          <button
            type="button"
            className="draconis-presentation__nav draconis-presentation__nav--next"
            onClick={showNextSlide}
            aria-label="다음 프레젠테이션 슬라이드"
          >
            →
          </button>
        </div>

        <div
          className="draconis-presentation__thumbnails"
          aria-label="프레젠테이션 슬라이드 선택"
        >
          {presentationSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={index === activeSlide ? 'is-active' : undefined}
              aria-current={index === activeSlide ? 'true' : undefined}
              aria-label={`${slide.number}번 슬라이드 보기`}
              onClick={() => setActiveSlide(index)}
            >
              <img
                src={slide.src}
                alt=""
                loading={index < 3 ? 'eager' : 'lazy'}
              />
              <span>{String(slide.number).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
