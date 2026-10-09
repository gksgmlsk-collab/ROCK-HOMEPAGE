import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { keepDialogFocus } from '../utils/dialogFocus';
type DraconisGalleryItem = {
  src: string;
  alt: string;
  caption: string;
  highlight?: boolean;
};

const draconisGallery: DraconisGalleryItem[] = [
  {
    src: '/assets/lab/draconis-learning-home.png',
    alt: '드라코니스 학습 모험 홈 화면',
    caption: '학습 모험 홈',
  },
  {
    src: '/assets/lab/draconis-world-card.png',
    alt: '드라코니스 세계관을 보여 주는 드래곤 카드',
    caption: '드라코니스 세계관',
  },
  {
    src: '/assets/lab/draconis-school-overview.jpg',
    alt: '드라코니스 학교 통합 참여 현황 화면',
    caption: '학교 통합 참여 현황',
  },
  {
    src: '/assets/lab/draconis-subject-stats.jpg',
    alt: '드라코니스 과목별 학습 통계 화면',
    caption: '과목별 학습 통계',
  },
  {
    src: '/assets/lab/draconis-learning-tools.jpg',
    alt: '드라코니스 학습 도구 화면',
    caption: '학습 도구',
  },
  {
    src: '/assets/lab/draconis-analysis-overview.jpg',
    alt: '드라코니스 문항 유형과 주제별 학습 분석 화면',
    caption: '문항·주제별 학습 분석',
  },
  {
    src: '/assets/lab/draconis-misconceptions-private.jpg',
    alt: '학생 식별 정보를 가린 드라코니스 학생별 오개념 분석 화면',
    caption: '학생별 오개념 분석',
  },
  {
    src: '/assets/lab/draconis-teacher-errors-private.jpg',
    alt: '학급 정보를 가린 드라코니스 교사용 오개념 처방 화면',
    caption: '교사용 오개념 처방',
  },
  {
    src: '/assets/lab/draconis-math-fractions.jpg',
    alt: '드라코니스 분수의 덧셈과 뺄셈 문제 화면',
    caption: '수학 · 분수 연산',
  },
  {
    src: '/assets/lab/draconis-math-graph.jpg',
    alt: '드라코니스 꺾은선그래프 문제 화면',
    caption: '수학 · 그래프 해석',
  },
  {
    src: '/assets/lab/draconis-math-division.jpg',
    alt: '드라코니스 나눗셈과 분수 문제 화면',
    caption: '수학 · 나눗셈',
  },
  {
    src: '/assets/lab/draconis-math-ratio.jpg',
    alt: '드라코니스 비례식과 비례배분 문제 화면',
    caption: '수학 · 비례식',
  },
  {
    src: '/assets/lab/draconis-cla-problem.jpg',
    alt: '드라코니스 CLA 풀이의 문제 파악 단계 화면',
    caption: 'CLA 1단계 · 문제 파악',
    highlight: true,
  },
  {
    src: '/assets/lab/draconis-cla-calculation.jpg',
    alt: '드라코니스 CLA 풀이의 계산 과정 단계 화면',
    caption: 'CLA 2단계 · 계산 과정',
    highlight: true,
  },
  {
    src: '/assets/lab/draconis-cla-solution.jpg',
    alt: '드라코니스 CLA 풀이의 최종 확인 단계 화면',
    caption: 'CLA 3단계 · 최종 확인',
    highlight: true,
  },
  {
    src: '/assets/lab/draconis-korean-hub.jpg',
    alt: '드라코니스 국어 달의 미궁 학습 화면',
    caption: '국어 · 달의 미궁',
  },
  {
    src: '/assets/lab/draconis-vocabulary-question.jpg',
    alt: '드라코니스 어휘 던전 문제 화면',
    caption: '국어 · 어휘 던전',
  },
  {
    src: '/assets/lab/draconis-dungeon-map.jpg',
    alt: '드라코니스 어휘 던전 탐험 지도 화면',
    caption: '국어 · 던전 탐험',
  },
  {
    src: '/assets/lab/draconis-reading-hub.jpg',
    alt: '드라코니스 비문학 독해 학습 화면',
    caption: '국어 · 비문학 독해',
  },
  {
    src: '/assets/lab/draconis-reading-passage.jpg',
    alt: '드라코니스 읽기 자료 오답이라는 이름의 데이터 화면',
    caption: '국어 · 읽기 자료',
  },
  {
    src: '/assets/lab/draconis-reading-question.jpg',
    alt: '드라코니스 읽기 자료 확인 문제 화면',
    caption: '국어 · 독해 문제',
  },
  {
    src: '/assets/lab/draconis-reading-feedback.jpg',
    alt: '드라코니스 국어 독해 정답과 해설 화면',
    caption: '국어 · 독해 피드백',
  },
  {
    src: '/assets/lab/draconis-english-listening.jpg',
    alt: '드라코니스 영어 듣고 고르기 문제 화면',
    caption: '영어 · 듣기',
  },
  {
    src: '/assets/lab/draconis-english-vocabulary.jpg',
    alt: '드라코니스 영어 낱말 고르기 문제 화면',
    caption: '영어 · 낱말',
  },
  {
    src: '/assets/lab/draconis-english-sentence.jpg',
    alt: '드라코니스 영어 문장 순서 학습 화면',
    caption: '영어 · 문장 만들기',
  },
  {
    src: '/assets/lab/draconis-exercise.jpg',
    alt: '드라코니스 운동 활동 지원 화면',
    caption: '생활 · 운동 활동',
  },
  {
    src: '/assets/lab/draconis-dragon-growth.jpg',
    alt: '드라코니스 나의 드래곤 성장 화면',
    caption: '성장 · 나의 드래곤',
  },
];

export type DraconisViewerItem = {
  src: string;
  alt: string;
  caption: string;
};

export function DraconisImageViewer({ items, index, onSelect, onClose, kind = 'gallery' }: {
  items: DraconisViewerItem[];
  index: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  kind?: 'gallery' | 'presentation';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [zoom, setZoom] = useState(100);
  const [readingWidth, setReadingWidth] = useState(0);
  const item = items[index];
  const move = (delta: number) => onSelect((index + delta + items.length) % items.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    setZoom(100);
    viewportRef.current?.scrollTo(0, 0);
  }, [index]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image) return;
    const measureReadingWidth = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      setReadingWidth(Math.min(image.naturalWidth, viewport.clientWidth));
    };
    const resize = new ResizeObserver(measureReadingWidth);
    resize.observe(viewport);
    image.addEventListener('load', measureReadingWidth);
    measureReadingWidth();
    return () => { resize.disconnect(); image.removeEventListener('load', measureReadingWidth); };
  }, [index]);

  const setViewZoom = (value: number) => {
    setZoom(value);
    viewportRef.current?.scrollTo(0, 0);
  };

  return createPortal(
    <dialog className="draconis-image-viewer draconis-gallery__dialog" ref={dialogRef}
      aria-labelledby={titleId} aria-describedby={hintId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        keepDialogFocus(event);
        if (event.target === viewportRef.current && zoom > 100) return;
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <header className="draconis-gallery__dialog-header">
        <div><p className="draconis-gallery__dialog-count">{index + 1} / {items.length}</p><h3 id={titleId}>{item.caption}</h3></div>
        <button className="draconis-gallery__dialog-close" type="button" aria-label={kind === 'gallery' ? '갤러리 닫기' : '프레젠테이션 닫기'} onClick={onClose} autoFocus><span aria-hidden="true">×</span></button>
      </header>
      <div className="draconis-image-viewer__toolbar" role="group" aria-label="이미지 확대 조절">
        <button type="button" aria-pressed={zoom === 100} onClick={() => setViewZoom(100)}>화면 맞춤</button>
        <button type="button" aria-pressed={zoom === 150} onClick={() => setViewZoom(150)}>글씨 크게</button>
        <button type="button" aria-pressed={zoom === 200} onClick={() => setViewZoom(200)}>더 크게</button>
        <a href={item.src} target="_blank" rel="noopener noreferrer">원본 보기 <span aria-hidden="true">↗</span></a>
      </div>
      <div className={`draconis-image-viewer__viewport${zoom > 100 ? ' is-zoomed' : ''}`} ref={viewportRef} tabIndex={0} role="region" aria-label="확대 이미지, 스크롤하여 살펴보기">
        <img ref={imageRef} src={item.src} alt={item.alt} style={zoom > 100 && readingWidth ? { width: readingWidth * zoom / 100 } : undefined} />
      </div>
      <div className="draconis-gallery__dialog-controls">
        <button type="button" aria-label={kind === 'gallery' ? '이전 이미지' : '이전 확대 슬라이드'} onClick={() => move(-1)}><span aria-hidden="true">←</span> 이전</button>
        <p id={hintId} aria-live="polite">{zoom === 100 ? '글씨 크게를 누르면 내용을 자세히 읽을 수 있어요.' : '확대 중 · 화면 안에서 스크롤해 살펴보세요.'}</p>
        <button type="button" aria-label={kind === 'gallery' ? '다음 이미지' : '다음 확대 슬라이드'} onClick={() => move(1)}>다음 <span aria-hidden="true">→</span></button>
      </div>
    </dialog>, document.body,
  );
}

export function DraconisGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const railId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentItem = draconisGallery[activeIndex];

  const selectImage = (index: number) => {
    setActiveIndex(index);
    previewRef.current?.scrollTo(0, 0);
    const rail = railRef.current;
    const thumbnail = thumbnailRefs.current[index];
    if (rail && thumbnail) {
      const railBounds = rail.getBoundingClientRect();
      const thumbnailBounds = thumbnail.getBoundingClientRect();
      rail.scrollTo({ left: rail.scrollLeft + thumbnailBounds.left - railBounds.left - rail.clientWidth / 2 + thumbnail.clientWidth / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  const moveRail = (delta: number) => selectImage((activeIndex + delta + draconisGallery.length) % draconisGallery.length);

  return (
    <section className="draconis-gallery" aria-labelledby={`${railId}-title`}>
      <header className="draconis-gallery__header">
        <div><p className="draconis-gallery__eyebrow">LEARNING IN ACTION</p><h3 id={`${railId}-title`}>드라코니스 학습 화면</h3><p className="draconis-gallery__intro">과목별 학습부터 성장 기록까지, 실제 화면으로 살펴보세요.</p></div>
        <p className="draconis-gallery__status" aria-live="polite">{activeIndex + 1} / {draconisGallery.length}</p>
      </header>
      <div className="draconis-gallery__preview-heading"><h4>{currentItem.caption}</h4><button type="button" onClick={() => setModalIndex(activeIndex)}>화면 확대 <span aria-hidden="true">↗</span></button></div>
      <div className="draconis-gallery__preview" ref={previewRef} tabIndex={0} role="region" aria-label={`${currentItem.caption}, 스크롤하여 전체 화면 보기`}>
        <button type="button" onClick={() => setModalIndex(activeIndex)} aria-label={`${currentItem.caption} 크게 보기`}><img src={currentItem.src} alt={currentItem.alt} decoding="async" /></button>
      </div>
      <p className="draconis-gallery__preview-hint">화면 안에서 아래로 스크롤하거나, 화면 확대를 눌러 자세히 볼 수 있어요.</p>
      <div className="draconis-gallery__rail-shell">
        <button className="draconis-gallery__rail-control draconis-gallery__rail-control--previous" type="button" aria-controls={railId} aria-label="이전 갤러리 이미지" onClick={() => moveRail(-1)}><span aria-hidden="true">←</span></button>
        <ul className="draconis-gallery__rail" id={railId} ref={railRef} aria-label="드라코니스 화면 썸네일">
          {draconisGallery.map((item, index) => (
            <li className={`draconis-gallery__item${item.highlight ? ' draconis-gallery__item--highlight' : ''}`} key={item.src}>
              <button className="draconis-gallery__thumbnail" type="button" aria-label={`${item.caption} 선택, ${index + 1} / ${draconisGallery.length}`} aria-current={activeIndex === index ? 'true' : undefined} ref={(element) => { thumbnailRefs.current[index] = element; }} onClick={() => selectImage(index)}>
                <img src={item.src} alt="" loading="lazy" decoding="async" /><span>{item.caption}</span>
              </button>
            </li>
          ))}
        </ul>
        <button className="draconis-gallery__rail-control draconis-gallery__rail-control--next" type="button" aria-controls={railId} aria-label="다음 갤러리 이미지" onClick={() => moveRail(1)}><span aria-hidden="true">→</span></button>
      </div>
      {modalIndex !== null && <DraconisImageViewer items={draconisGallery} index={modalIndex} onSelect={(index) => { setModalIndex(index); selectImage(index); }} onClose={() => setModalIndex(null)} />}
    </section>
  );
}
