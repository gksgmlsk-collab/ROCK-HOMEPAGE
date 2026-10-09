import { awards } from '../data/labContent';

export function AwardsSection() {
  return (
    <section className="content-section awards-section" id="lab-awards">
      <div className="content-shell">
        <header className="section-heading section-heading--light">
          <div>
            <p className="section-kicker">RECOGNITION</p>
            <h2>연구소 수상</h2>
          </div>
          <p>
            기술의 화려함보다 학교 현장의 문제를 정확히 정의하고, 검증 가능한
            해법으로 연결한 결과입니다.
          </p>
        </header>

        <div className="awards-list">
          {awards.map((item, index) => (
            <article className="award-card" key={item.id}>
              <div className="award-card__media">
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="award-card__content">
                <p className="award-card__eyebrow">{item.eyebrow}</p>
                <div className="award-card__award-line">
                  <p className="award-card__badge">{item.award}</p>
                  {item.badgeImage && item.badgeImageAlt && (
                    <img
                      className="award-card__digital-badge"
                      src={item.badgeImage}
                      alt={item.badgeImageAlt}
                      loading="lazy"
                    />
                  )}
                </div>
                <h3>
                  {item.title.split('\n').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
                <p className="award-card__team">{item.team}</p>
                {item.recognition && (
                  <p className="award-card__recognition">{item.recognition}</p>
                )}
                <p className="award-card__summary">{item.summary}</p>
                <dl className="award-card__stats">
                  {item.stats.map((stat) => (
                    <div key={stat.label}>
                      <dt>{stat.value}</dt>
                      <dd>{stat.label}</dd>
                    </div>
                  ))}
                </dl>
                <div className="award-card__actions">
                  <a
                    href={item.reportUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    공식 수상 보고
                    <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    href={item.serviceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    관련 서비스
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
