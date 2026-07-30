import { useMemo, useState } from 'react';
import {
  type ProjectCategory,
  projectCategories,
  projects,
} from '../data/labContent';

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] =
    useState<ProjectCategory>('전체');
  const filteredProjects = useMemo(
    () =>
      activeCategory === '전체'
        ? projects
        : projects.filter((project) => project.category === activeCategory),
    [activeCategory],
  );

  return (
    <section className="content-section portfolio-section" id="lab-services">
      <div className="content-shell">
        <header className="section-heading">
          <div>
            <p className="section-kicker">SERVICE PORTFOLIO</p>
            <h2>서비스 포트폴리오</h2>
          </div>
          <p>
            학습, 행정, 안전, 소통과 연구소 운영까지. 완성도만이 아니라 현재
            단계와 담당을 함께 기록합니다.
          </p>
        </header>

        <div className="portfolio-filter" aria-label="프로젝트 카테고리">
          {projectCategories.map((category) => {
            const count =
              category === '전체'
                ? projects.length
                : projects.filter((project) => project.category === category).length;
            return (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? 'is-active' : ''}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="project-grid" aria-live="polite">
          {filteredProjects.map((project, index) => (
            <article
              className="project-card"
              data-category={project.category}
              key={project.id}
            >
              <div className="project-card__topline">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{project.category}</span>
              </div>
              <h3>{project.name}</h3>
              <dl>
                <div>
                  <dt>단계</dt>
                  <dd>{project.stage}</dd>
                </div>
                <div>
                  <dt>담당</dt>
                  <dd>
                    {project.owner}
                    {project.ownerNote && <small>{project.ownerNote}</small>}
                  </dd>
                </div>
              </dl>
              <div className="project-card__summary">
                {project.summary.split('\n\n').map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {project.url ? (
                <a
                  className="project-card__action"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${project.name} ${project.actionLabel}, 새 창`}
                >
                  {project.actionLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <button
                  className="project-card__action is-disabled"
                  type="button"
                  disabled
                >
                  {project.actionLabel}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
