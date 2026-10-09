import { useEffect, useMemo, useState } from 'react';
import { type Project, type ProjectCategory, legacyResources, projectCategories, projects, serviceAreas } from '../data/labContent';

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card" data-category={project.category} data-project={project.id}>
      <div className="project-card__topline"><span>{project.category}</span><span>{project.relatedTo ? '연계 기능' : project.url ? '웹 서비스' : '검토 중'}</span></div>
      <h5>{project.name}</h5>
      {project.relatedTo && <p className="project-card__relationship">{project.relatedTo}</p>}
      <dl>
        <div><dt>대상</dt><dd>{project.audience}</dd></div>
        {project.owner && <div><dt>담당</dt><dd>{project.owner}{project.ownerNote && <small>{project.ownerNote}</small>}</dd></div>}
      </dl>
      <div className="project-card__summary">{project.summary.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      {project.url ? (
        <a className="project-card__action" href={project.url} target="_blank" rel="noreferrer noopener" aria-label={`${project.name} ${project.actionLabel}, 새 창`}>
          {project.actionLabel}<span aria-hidden="true">↗</span>
        </a>
      ) : <button className="project-card__action is-disabled" type="button" disabled>{project.actionLabel}</button>}
    </article>
  );
}

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('전체');
  const [query, setQuery] = useState('');
  useEffect(() => {
    // Domain links must still work after a previous filter or search.
    const resetForAnchor = () => {
      if (window.location.hash.startsWith('#portfolio-')) { setActiveCategory('전체'); setQuery(''); }
    };
    const handleClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('a[href^="#portfolio-"]')) { setActiveCategory('전체'); setQuery(''); }
    };
    resetForAnchor();
    window.addEventListener('hashchange', resetForAnchor);
    document.addEventListener('click', handleClick);
    return () => { window.removeEventListener('hashchange', resetForAnchor); document.removeEventListener('click', handleClick); };
  }, []);
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase('ko').replace(/\s+/g, '');
    return projects.filter(project =>
      (activeCategory === '전체' || project.category === activeCategory) &&
      [project.name, project.category, project.subgroup, project.audience, project.summary, project.relatedTo ?? '']
        .join(' ').toLocaleLowerCase('ko').replace(/\s+/g, '').includes(normalizedQuery));
  }, [activeCategory, query]);
  return (
    <section className="content-section portfolio-section" id="lab-services">
      <div className="content-shell">
        <header className="section-heading">
          <div><p className="section-kicker">FIND YOUR SCHOOL APP</p><h2>필요한 순간,<br />맞는 앱으로.</h2></div>
          <p>학생의 배움부터 학교의 일상까지. 누구를 위한 앱인지, 어떤 일을 돕는지에 따라 찾아보세요. 드라코니스 안의 연계 기능을 포함한 {projects.length}개 앱·기능을 안내합니다.</p>
        </header>
        <div className="directory-toolbar">
          <div className="portfolio-filter" role="group" aria-label="프로젝트 카테고리">
            {projectCategories.map(category => (
              <button type="button" key={category} className={activeCategory === category ? 'is-active' : ''}
                aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>
                {category}<span>{category === '전체' ? projects.length : projects.filter(project => project.category === category).length}</span>
              </button>
            ))}
          </div>
          <div className="directory-search">
            <label htmlFor="app-search">앱 검색</label>
            <div>
              <input id="app-search" type="search" value={query} placeholder="앱 이름, 이용 대상, 필요한 기능" onChange={event => setQuery(event.target.value)} />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="검색 지우기">지우기</button>}
            </div>
          </div>
        </div>
        <p className="directory-result" role="status">{activeCategory} · {filteredProjects.length}개 앱·기능{query.trim() && ` · “${query.trim()}” 검색 결과`}</p>
        <div className="directory-results">
          {serviceAreas.map(area => {
            const areaProjects = filteredProjects.filter(project => project.category === area.name);
            if (!areaProjects.length) return null;
            return (
              <section className="directory-area" id={`portfolio-${area.id}`} key={area.id} aria-labelledby={`portfolio-heading-${area.id}`}>
                <header className="directory-area__heading"><p>{area.eyebrow}</p><h3 id={`portfolio-heading-${area.id}`}>{area.name}<span>{areaProjects.length}</span></h3></header>
                {area.groups.map(group => {
                  const groupProjects = areaProjects.filter(project => project.subgroup === group.name);
                  if (!groupProjects.length) return null;
                  return (
                    <div className="directory-group" key={group.name}>
                      <header><h4>{group.name}</h4><p>{group.description}</p></header>
                      <div className="project-grid">{groupProjects.map(project => <ProjectCard key={project.id} project={project} />)}</div>
                    </div>
                  );
                })}
              </section>
            );
          })}
          {!filteredProjects.length && <div className="directory-empty"><h3>조건에 맞는 앱이 없습니다.</h3><p>다른 검색어를 입력하거나 전체 앱을 살펴보세요.</p><button type="button" onClick={() => { setQuery(''); setActiveCategory('전체'); }}>전체 앱 다시 보기</button></div>}
        </div>
        <details className="legacy-resources">
          <summary>연구소 기록과 이전 프로젝트</summary>
          <p>기존에 소개한 운영 채널과 프로젝트도 이곳에서 이어 볼 수 있습니다.</p>
          <ul>{legacyResources.map(resource => <li key={resource.id}><a href={resource.url} target="_blank" rel="noreferrer noopener">{resource.name}<span aria-hidden="true"> ↗</span></a><p>{resource.summary}</p></li>)}</ul>
        </details>
      </div>
    </section>
  );
}
