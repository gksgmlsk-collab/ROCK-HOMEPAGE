import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

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

const wrapIndex = (index: number) =>
  (index + draconisGallery.length) % draconisGallery.length;

export function DraconisGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const railId = useId();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const scrollThumbnailIntoView = useCallback((index: number) => {
    thumbnailRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, []);

  const moveRail = useCallback(
    (delta: number) => {
      setActiveIndex((currentIndex) => {
        const nextIndex = wrapIndex(currentIndex + delta);
        scrollThumbnailIntoView(nextIndex);
        return nextIndex;
      });
    },
    [scrollThumbnailIntoView],
  );

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
    setModalIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setModalIndex(null);
  }, []);

  const moveModal = useCallback((delta: number) => {
    setModalIndex((currentIndex) =>
      currentIndex === null ? null : wrapIndex(currentIndex + delta),
    );
  }, []);
  const isModalOpen = modalIndex !== null;

  useEffect(() => {
    if (modalIndex !== null) {
      setActiveIndex(modalIndex);
    }
  }, [modalIndex]);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveModal(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveModal(1);
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [closeModal, isModalOpen, moveModal]);

  const trapDialogFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements?.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const modalItem = modalIndex === null ? null : draconisGallery[modalIndex];

  return (
    <section className="draconis-gallery" aria-labelledby={`${railId}-title`}>
      <header className="draconis-gallery__header">
        <div>
          <p className="draconis-gallery__eyebrow">DRACONIS GALLERY</p>
          <h3 id={`${railId}-title`}>드라코니스 학습 화면</h3>
        </div>
        <p className="draconis-gallery__status" aria-live="polite">
          {activeIndex + 1} / {draconisGallery.length}
        </p>
      </header>

      <div className="draconis-gallery__rail-shell">
        <button
          className="draconis-gallery__rail-control draconis-gallery__rail-control--previous"
          type="button"
          aria-controls={railId}
          aria-label="이전 갤러리 이미지"
          onClick={() => moveRail(-1)}
        >
          <span aria-hidden="true">←</span>
        </button>

        <ul
          className="draconis-gallery__rail"
          id={railId}
          ref={railRef}
          aria-label="드라코니스 화면 썸네일"
        >
          {draconisGallery.map((item, index) => (
            <li
              className={`draconis-gallery__item${
                item.highlight ? ' draconis-gallery__item--highlight' : ''
              }`}
              key={item.src}
            >
              <button
                className="draconis-gallery__thumbnail"
                type="button"
                aria-label={`${item.caption} 크게 보기, ${index + 1} / ${
                  draconisGallery.length
                }`}
                aria-current={activeIndex === index ? 'true' : undefined}
                ref={(element) => {
                  thumbnailRefs.current[index] = element;
                }}
                onClick={() => openModal(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <img src={item.src} alt="" loading="lazy" decoding="async" />
                <span>{item.caption}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          className="draconis-gallery__rail-control draconis-gallery__rail-control--next"
          type="button"
          aria-controls={railId}
          aria-label="다음 갤러리 이미지"
          onClick={() => moveRail(1)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {modalItem && modalIndex !== null
        ? createPortal(
            (
        <div
          className="draconis-gallery__backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeModal();
            }
          }}
        >
          <div
            className="draconis-gallery__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            ref={dialogRef}
            onKeyDown={trapDialogFocus}
          >
            <header className="draconis-gallery__dialog-header">
              <div>
                <p className="draconis-gallery__dialog-count">
                  {modalIndex + 1} / {draconisGallery.length}
                </p>
                <h3 id={dialogTitleId}>{modalItem.caption}</h3>
              </div>
              <button
                className="draconis-gallery__dialog-close"
                type="button"
                aria-label="갤러리 닫기"
                ref={closeButtonRef}
                onClick={closeModal}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <figure className="draconis-gallery__dialog-figure">
              <img src={modalItem.src} alt={modalItem.alt} decoding="async" />
              <figcaption id={dialogDescriptionId}>
                {modalItem.caption}
              </figcaption>
            </figure>

            <div
              className="draconis-gallery__dialog-controls"
              aria-label="확대 이미지 탐색"
            >
              <button
                type="button"
                aria-label="이전 이미지"
                onClick={() => moveModal(-1)}
              >
                <span aria-hidden="true">←</span>
                이전
              </button>
              <button
                type="button"
                aria-label="다음 이미지"
                onClick={() => moveModal(1)}
              >
                다음
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
            ),
            document.body,
          )
        : null}
    </section>
  );
}
