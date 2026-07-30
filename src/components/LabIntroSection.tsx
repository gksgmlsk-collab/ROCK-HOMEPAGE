import { labIntro } from '../data/labContent';

export function LabIntroSection() {
  return (
    <section className="content-section lab-intro" id="lab-intro">
      <div className="content-shell">
        <div className="intro-editorial">
          <div className="intro-editorial__copy">
            <p className="section-kicker">{labIntro.label}</p>
            <h2>{labIntro.title}</h2>
            <div className="intro-editorial__body">
              {labIntro.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <figure className="intro-editorial__visual">
            <div className="intro-editorial__orb" aria-hidden="true" />
            <img
              src="/assets/lab/dolbot-header.png"
              alt="돌 AI연구소의 AI 도우미 돌봇"
              loading="lazy"
            />
            <figcaption>사람의 판단을 돕는, 학교 곁의 AI</figcaption>
          </figure>
        </div>

        <div className="principle-grid" aria-label="연구소 핵심 원칙">
          {labIntro.principles.map((principle, index) => (
            <article key={principle.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{principle.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
