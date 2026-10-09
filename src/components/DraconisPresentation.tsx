import { useRef, useState } from 'react';
import { DraconisImageViewer } from './DraconisGallery';

const presentation = {
  href: '/assets/lab/draconis-presentation-2026-07-31.ppsm',
  downloadName: 'draconis-presentation(2026.07.31).ppsm',
};

const presentationSlides = Array.from({ length: 18 }, (_, index) => ({
  src: `/assets/lab/draconis-presentation/slides/slide-${String(index + 1).padStart(2, '0')}.jpg`,
  number: index + 1,
  alt: `드라코니스 프레젠테이션 ${index + 1}번 슬라이드`,
  caption: `드라코니스 소개 자료 · ${index + 1}번 슬라이드`,
}));

export function DraconisPresentation() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const currentSlide = presentationSlides[activeSlide];

  const selectSlide = (index: number) => {
    setActiveSlide(index);
    const rail = thumbnailRailRef.current;
    const thumbnail = rail?.children[index];
    if (rail && thumbnail instanceof HTMLElement) {
      rail.scrollTo({
        left: rail.scrollLeft + thumbnail.getBoundingClientRect().left - rail.getBoundingClientRect().left - rail.clientWidth / 2 + thumbnail.clientWidth / 2,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  };

  const showPreviousSlide = () => {
    selectSlide(activeSlide === 0 ? presentationSlides.length - 1 : activeSlide - 1);
  };

  const showNextSlide = () => {
    selectSlide((activeSlide + 1) % presentationSlides.length);
  };

  return (
    <section
      className="draconis-presentation"
      aria-labelledby="draconis-presentation-title"
    >
      <div className="draconis-presentation__header">
        <div className="draconis-presentation__copy">
          <p className="draconis-presentation__eyebrow">POWERPOINT SHOW</p>
          <h3 id="draconis-presentation-title">드라코니스 소개 자료</h3>
          <p>
            슬라이드 18장을 한 장씩 크게 살펴보세요. 화면 확대를 누르면
            작은 글씨까지 더 자세히 읽을 수 있습니다.
          </p>
          <span>애니메이션은 PPSM 원본에서 확인할 수 있습니다. · 약 56MB</span>
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
        </div>
      </div>

      <div className="draconis-presentation__viewer">
        <div
          className="draconis-presentation__stage"
          aria-live="polite"
          aria-label={`드라코니스 프레젠테이션 ${currentSlide.number}번 슬라이드`}
        >
          <button type="button" className="draconis-presentation__enlarge" aria-label={`${currentSlide.number}번 슬라이드 크게 보기`} onClick={() => setExpanded(true)}>
            <img src={currentSlide.src} alt={currentSlide.alt} />
          </button>
        </div>
        <div className="draconis-presentation__controls" aria-label="프레젠테이션 넘기기">
          <span className="draconis-presentation__counter" aria-live="polite">
            {currentSlide.number} / {presentationSlides.length}
          </span>
          <button type="button" className="draconis-presentation__expand-button" onClick={() => setExpanded(true)}>화면 확대 <span aria-hidden="true">↗</span></button>
          <div className="draconis-presentation__navigation">
          <button
            type="button"
            className="draconis-presentation__nav draconis-presentation__nav--previous"
            onClick={showPreviousSlide}
            aria-label="이전 프레젠테이션 슬라이드"
          >
            <span aria-hidden="true">←</span> 이전
          </button>
          <button
            type="button"
            className="draconis-presentation__nav draconis-presentation__nav--next"
            onClick={showNextSlide}
            aria-label="다음 프레젠테이션 슬라이드"
          >
            다음 <span aria-hidden="true">→</span>
          </button>
          </div>
        </div>

        <div
          className="draconis-presentation__thumbnails"
          ref={thumbnailRailRef}
          aria-label="프레젠테이션 슬라이드 선택"
        >
          {presentationSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={index === activeSlide ? 'is-active' : undefined}
              aria-current={index === activeSlide ? 'true' : undefined}
              aria-label={`${slide.number}번 슬라이드 보기`}
              onClick={() => selectSlide(index)}
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
      {expanded && <DraconisImageViewer items={presentationSlides} index={activeSlide} onSelect={selectSlide} onClose={() => setExpanded(false)} kind="presentation" />}
    </section>
  );
}
