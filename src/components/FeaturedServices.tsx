import { featuredServices } from '../data/labContent';
import { DraconisGallery } from './DraconisGallery';

export function FeaturedServices() {
  return (
    <section className="content-section featured-services" id="lab-featured">
      <div className="content-shell">
        <header className="section-heading">
          <div>
            <p className="section-kicker">FEATURED SERVICES</p>
            <h2>대표 서비스</h2>
          </div>
          <p>
            학교의 실제 문제에서 출발해, 교직원이 직접 설계하고 현장에서 다듬는
            네 가지 대표 사례입니다.
          </p>
        </header>

        <div className="featured-grid">
          {featuredServices.map((service, index) => {
            const isDraconis = service.id === 'draconis';

            return (
              <article className="featured-card" data-service={service.id} key={service.id}>
                {!isDraconis && (
                  <div className="featured-card__media" data-fit={service.imageFit}>
                    <img
                      src={service.image}
                      alt={service.imageAlt}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="featured-card__content">
                  <div>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{service.category}</p>
                  </div>
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                  {isDraconis && <DraconisGallery />}
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${service.name} ${service.actionLabel}, 새 창`}
                  >
                    {service.actionLabel}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
