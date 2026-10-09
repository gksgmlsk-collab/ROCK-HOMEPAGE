import { awards } from '../data/labContent';

function LaurelMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`award-laurel ${className}`} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M55 105C21 91 14 54 34 24M65 105C99 91 106 54 86 24" />
      </g>
      <g fill="currentColor">
        <path d="M34 24c-9-1-13 4-12 14 9-2 12-7 12-14Zm-11 15c-9 2-10 8-6 16 7-4 9-10 6-16Zm-5 20c-7 5-6 12 1 18 5-7 5-12-1-18Zm7 20c-5 7-2 14 7 18 3-8 0-14-7-18Zm15 17c-2 9 4 14 14 14-1-9-6-13-14-14ZM29 44c10-1 15-6 14-14-9 0-14 5-14 14Zm-5 20c10-2 14-7 12-15-9 2-13 7-12 15Zm5 18c9-4 12-10 8-17-8 4-11 10-8 17Zm12 16c7-6 8-13 2-19-6 6-7 13-2 19Z" />
        <g transform="translate(120 0) scale(-1 1)">
          <path d="M34 24c-9-1-13 4-12 14 9-2 12-7 12-14Zm-11 15c-9 2-10 8-6 16 7-4 9-10 6-16Zm-5 20c-7 5-6 12 1 18 5-7 5-12-1-18Zm7 20c-5 7-2 14 7 18 3-8 0-14-7-18Zm15 17c-2 9 4 14 14 14-1-9-6-13-14-14ZM29 44c10-1 15-6 14-14-9 0-14 5-14 14Zm-5 20c10-2 14-7 12-15-9 2-13 7-12 15Zm5 18c9-4 12-10 8-17-8 4-11 10-8 17Zm12 16c7-6 8-13 2-19-6 6-7 13-2 19Z" />
        </g>
        <path d="m60 33 6.4 16.9 18 .9-14 11.3 4.7 17.4L60 69.6 44.9 79.5l4.7-17.4-14-11.3 18-.9L60 33Z" />
      </g>
      <path d="M50 109h20" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function AwardsShowcase() {
  return (
    <section className="about-awards awards-showcase" aria-labelledby="about-title">
      <header className="awards-showcase__heading">
        <div>
          <p className="awards-showcase__eyebrow"><span aria-hidden="true">✦</span> DOL AI LAB · HONORS</p>
          <h1 id="about-title">연구소 <em>수상</em></h1>
          <p className="awards-showcase__description">학교 현장에서 시작된 아이디어,<br className="awards-showcase__mobile-break" /> 더 큰 무대에서 가치를 인정받다.</p>
        </div>
        <div className="awards-showcase__seal" aria-hidden="true">
          <LaurelMark />
          <span>FROM SCHOOL<br />TO IMPACT</span>
        </div>
      </header>

      <div className="awards-showcase__grid">
        {awards.map((award, index) => {
          const [rank, issuer] = award.award.split(' · ');
          return (
            <article className="about-award award-showcase-card" data-award={award.id} key={award.id}>
              <header className="award-showcase-card__honor" aria-label={award.award}>
                {award.badgeImage && award.badgeImageAlt ? (
                  <img className="award-showcase-card__digital-badge" src={award.badgeImage} alt={award.badgeImageAlt} loading="lazy" decoding="async" />
                ) : <LaurelMark />}
                <div>
                  <p className="award-showcase-card__issuer">{issuer}</p>
                  <p className="award-showcase-card__rank">{rank}</p>
                </div>
                <span className="award-showcase-card__index" aria-hidden="true">0{index + 1}</span>
              </header>

              <a className="award-showcase-card__media" href={award.reportUrl} target="_blank" rel="noopener noreferrer" aria-label={`${award.title.replaceAll('\n', ' ')} 공식 수상 보고, 새 창`}>
                <img src={award.image} alt={award.imageAlt} loading="lazy" decoding="async" />
                <span className="award-showcase-card__media-label">수상작 자세히 보기 <span aria-hidden="true">↗</span></span>
              </a>

              <div className="award-showcase-card__body">
                <p className="award-showcase-card__competition">{award.eyebrow}</p>
                <h2>{award.title.replaceAll('\n', ' ')}</h2>
                <p className="award-showcase-card__team">{award.team}</p>
                <p className="award-showcase-card__summary">{award.summary}</p>
                {award.recognition && <p className="award-showcase-card__recognition"><span aria-hidden="true">✦</span>{award.recognition}</p>}

                <dl className="award-showcase-card__stats">
                  {award.stats.map((stat) => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}
                </dl>

                <div className="award-showcase-card__actions">
                  <a href={award.reportUrl} target="_blank" rel="noopener noreferrer">공식 수상 보고 <span aria-hidden="true">↗</span></a>
                  <a href={award.serviceUrl} target="_blank" rel="noopener noreferrer">관련 서비스 <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
