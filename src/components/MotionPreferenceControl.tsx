type MotionPreferenceControlProps = {
  mode: 'static' | 'animated';
  onChange: () => void;
};

export function MotionPreferenceControl({
  mode,
  onChange,
}: MotionPreferenceControlProps) {
  const isStatic = mode === 'static';

  return (
    <button
      className={`motion-preference motion-preference--${mode}`}
      type="button"
      onClick={onChange}
      aria-label={
        isStatic
          ? '움직이는 스크롤 영상으로 보기'
          : '움직임을 멈추고 정적 화면으로 돌아가기'
      }
    >
      <span className="motion-preference__icon" aria-hidden="true">
        {isStatic ? '▶' : '‖'}
      </span>
      <span className="motion-preference__copy">
        <strong>
          {isStatic ? '애니메이션으로 보기' : '정적 화면으로 돌아가기'}
        </strong>
        {isStatic && <small>기기 설정과 관계없이 영상을 재생합니다</small>}
      </span>
    </button>
  );
}
