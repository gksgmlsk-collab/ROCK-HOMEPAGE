import { featuredServices, projects, serviceAreas } from '../data/labContent';
import { DraconisGallery } from './DraconisGallery';
import { DraconisPresentation } from './DraconisPresentation';

const portalShortcutIds = ['schoolletter', 'school-ai-admin', 'banner-factory', 'staffroom'];

function AdministrationPortal() {
  const buffet = featuredServices.find((service) => service.id === 'seokam-buffet');
  const shortcuts = portalShortcutIds.flatMap((id) => {
    const project = projects.find((item) => item.id === id);
    return project ? [project] : [];
  });

  return (
    <aside className="service-portal admin-portal" aria-labelledby="service-portal-title">
      <div className="service-portal__intro">
        <p className="service-portal__label">앞으로의 연계 방향</p>
        <h4 id="service-portal-title">업무의 시작을 한곳에서.</h4>
        <p>
          석암뷔페를 교직원 업무의 중심 포털로 두고, 필요한 기능으로 바로
          이동하는 구조를 지향합니다. 여러 앱의 이름과 주소를 기억하는 부담을
          줄이는 것이 목표입니다.
        </p>
      </div>

      <div className="service-portal__map">
        <div className="service-portal__center">
          <span>교직원 통합 포털 구상</span>
          <strong>석암뷔페</strong>
          {buffet && (
            <a href={buffet.url} target="_blank" rel="noreferrer noopener">
              현재 서비스 열기 <span aria-hidden="true">↗</span>
              <span className="sr-only">, 새 창</span>
            </a>
          )}
        </div>
        <div className="service-portal__shortcuts">
          {shortcuts.map((project) =>
            project.url ? (
              <a href={project.url} target="_blank" rel="noreferrer noopener" key={project.id}>
                <span>{project.name}</span>
                <small>현재 개별 앱 바로가기 <span aria-hidden="true">↗</span></small>
                <span className="sr-only">, 새 창</span>
              </a>
            ) : null,
          )}
        </div>
      </div>

      <p className="service-portal__note">
        위 링크는 기존 개별 앱으로 연결됩니다. 석암뷔페 내부 메뉴
        연계는 앞으로 검토할 개선 방향입니다.
      </p>
      <div className="service-portal__on">
        <span>석암 ON 정리 방향</span>
        <p>
          <strong>보결관리 · 정보화기기 및 컴퓨터 정보 수집·관리</strong> 등 자주
          쓰는 핵심 기능을 먼저 드러내고, 나머지 기능은 석암뷔페의 관련 업무
          메뉴로 연결하는 방안을 검토합니다.
        </p>
      </div>
    </aside>
  );
}

export function FeaturedServices() {
  return (
    <section className="content-section featured-services" id="lab-featured">
      <div className="content-shell">
        <header className="section-heading">
          <div>
            <p className="section-kicker">THREE AREAS, ONE SCHOOL</p>
            <h2>학교를 돕는<br />세 가지 연결.</h2>
          </div>
          <p>
            학생의 배움부터 모두의 안전, 교직원의 업무까지.
            사용하는 사람과 목적에 따라 학교의 앱을 세 영역으로 안내합니다.
          </p>
        </header>

        <nav className="service-entry-grid" aria-label="서비스 영역 바로가기">
          {serviceAreas.map((area, index) => {
            const representatives = featuredServices.filter((service) => service.area === area.name);
            const count = projects.filter((project) => project.category === area.name).length;

            return (
              <a className="service-entry" href={`#lab-${area.id}`} key={area.id}>
                <div className="service-entry__top">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{count}개 앱·기능</span>
                </div>
                <strong>{area.name}</strong>
                <p>{area.summary}</p>
                <div className="service-entry__bottom">
                  <span>대표 · {representatives.map((service) => service.name).join(' · ')}</span>
                  <span aria-hidden="true">↘</span>
                </div>
              </a>
            );
          })}
        </nav>

        <div className="service-domains">
          {serviceAreas.map((area, index) => {
            const services = featuredServices.filter((service) => service.area === area.name);

            return (
              <section
                className="service-domain"
                data-area={area.id}
                id={`lab-${area.id}`}
                aria-labelledby={`service-domain-${area.id}-title`}
                key={area.id}
              >
                <header className="service-domain__heading">
                  <div className="service-domain__title">
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="section-kicker">{area.eyebrow}</p>
                      <h3 id={`service-domain-${area.id}-title`}>{area.name}</h3>
                    </div>
                  </div>
                  <div className="service-domain__description">
                    <p>{area.summary}</p>
                    <a href={`#portfolio-${area.id}`}>
                      전체 앱에서 더 보기 <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </header>

                <div className="service-domain__groups">
                  {area.groups.map((group) => (
                    <div key={group.name}>
                      <strong>{group.name}</strong>
                      <p>{group.description}</p>
                    </div>
                  ))}
                </div>

                <div className={`featured-grid service-feature-grid${services.length > 1 ? ' service-feature-grid--pair' : ''}`}>
                  {services.map((service) => (
                    <article
                      className="featured-card service-feature"
                      data-service={service.id}
                      aria-labelledby={`featured-${service.id}-title`}
                      key={service.id}
                    >
                      <div className="service-feature__main">
                        <div className="service-feature__media">
                          <img src={service.image} alt={service.imageAlt} loading="lazy" decoding="async" />
                          {service.id === 'seokam-buffet' && (
                            <p className="service-feature__caption">교육과정 설계·운영 미리보기 · 예시 데이터</p>
                          )}
                        </div>
                        <div className="featured-card__content service-feature__content">
                          <p className="service-feature__eyebrow">대표 앱 <span aria-hidden="true">/</span> {service.category}</p>
                          <h4 id={`featured-${service.id}-title`}>{service.name}</h4>
                          <p className="service-feature__summary">{service.summary}</p>
                          <a
                            className="service-feature__action"
                            href={service.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${service.name} ${service.actionLabel}, 새 창`}
                          >
                            {service.actionLabel}<span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                      {service.id === 'draconis' && (
                        <details className="service-feature__details">
                          <summary>
                            <span>드라코니스 소개 자료 보기</span>
                            <span className="service-feature__details-hint">프레젠테이션 · 학습 화면</span>
                          </summary>
                          <div className="service-feature__resources">
                            <DraconisPresentation />
                            <DraconisGallery />
                          </div>
                        </details>
                      )}
                    </article>
                  ))}
                </div>

                {area.id === 'admin' && <AdministrationPortal />}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
