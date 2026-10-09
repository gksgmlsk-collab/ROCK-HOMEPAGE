import { useEffect, useMemo, useRef, useState } from 'react';
import { featuredServices, legacyResources, projects, serviceAreas, type Project } from '../data/labContent';
import { DraconisGallery } from './DraconisGallery';
import { DraconisPresentation } from './DraconisPresentation';
import { keepDialogFocus } from '../utils/dialogFocus';

type AppArea = 'all' | 'student' | 'safety' | 'admin';
type AppWorkspaceProps = {
  area: AppArea;
  onNavigate: (view: 'apps' | 'student' | 'safety' | 'admin') => void;
};

const areaCopy = {
  student: { title: '배움이 자라는 도구', description: '교과와 프로젝트, 학생의 일상을 함께 지원합니다.' },
  safety: { title: '모두의 안심을 위한 도구', description: '교직원의 안전지원과 학부모·방문자의 안전서비스를 연결합니다.' },
  admin: { title: '학교의 일을 가볍게', description: '교육과정부터 학교 업무까지, 필요한 도구를 한곳에서 찾습니다.' },
};

const featuredCopy: Record<string, string> = {
  draconis: '배움을 모험으로, 참여를 성장으로. 교과학습과 학교생활을 연결하는 개인 맞춤 교수·학습 플랫폼입니다.',
  'beyond-radius': '직선거리 너머, 아이들이 실제로 걷는 길을 살펴봅니다. 공공데이터로 학교 주변 환경과 도보 접근성을 분석합니다.',
  dolsoe: '학교 사업계획과 관련 법령을 함께 검토합니다. 근거와 수정 권고를 확인하고 교직원이 최종 판단합니다.',
  'seokam-buffet': '교육과정 설계부터 학급 운영까지 이어지는 AI 지원 플랫폼. 교직원 업무의 중심 포털로 확장을 검토합니다.',
};

const featuredVisualCopy: Record<string, { label: string; headline: string; caption: string }> = {
  draconis: { label: 'DRACONIS', headline: '배움이 시작되는\n모험의 세계', caption: '나만의 드래곤과 함께 성장하는 학습 모험' },
  'beyond-radius': { label: 'BEYOND THE RADIUS', headline: '아이들이 걷는 길,\n반경 너머까지', caption: '학교 주변 환경과 도보 접근성을 한눈에' },
  dolsoe: { label: 'DOLSOE', headline: '학교의 계획에\n든든한 근거를', caption: '사업계획과 관련 법령을 함께 검토' },
  'seokam-buffet': { label: 'SEOKAM BUFFET', headline: '선생님의 하루를\n하나의 흐름으로', caption: '교육과정 설계부터 교직원 업무까지' },
};

const shortcutIds = ['schoolletter', 'school-ai-admin', 'banner-factory', 'staffroom'];
const pageSize = 6;

function ExternalAction({ project, className = 'app-action' }: { project: Pick<Project, 'name' | 'url' | 'actionLabel'>; className?: string }) {
  return project.url ? (
    <a className={className} href={project.url} target="_blank" rel="noreferrer noopener" aria-label={`${project.name} ${project.actionLabel}, 새 창`}>
      {project.actionLabel}<span aria-hidden="true">↗</span>
    </a>
  ) : <span className="app-unavailable">연결 준비 중</span>;
}

function AppDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const feature = featuredServices.find(service => service.id === project.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog className="app-dialog" ref={dialogRef} aria-labelledby="app-dialog-title"
      onKeyDown={keepDialogFocus}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <div className="app-dialog__body">
        <button className="app-dialog__close" type="button" aria-label="앱 상세 닫기" onClick={onClose} autoFocus>×</button>
        <p className="app-eyebrow">{project.category} <span aria-hidden="true">/</span> {project.subgroup}</p>
        <h2 id="app-dialog-title">{project.name}</h2>
        <dl className="app-dialog__meta">
          <div><dt>이용 대상</dt><dd>{project.audience}</dd></div>
          {project.id === 'draconis' && project.owner && <div><dt>담당</dt><dd>{project.owner}</dd></div>}
        </dl>
        {feature && <img className="app-dialog__image" src={feature.image} alt={feature.imageAlt} />}
        <div className="app-dialog__description">
          {(feature?.summary ?? project.summary).split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {project.relatedTo && <p className="app-dialog__relation">{project.relatedTo}</p>}
        {!project.url && <p className="app-dialog__note">구체적인 기능과 연결 주소를 확인한 뒤 안내할 예정입니다.</p>}
        <div className="app-dialog__actions"><ExternalAction project={project} /><button type="button" className="app-text-button" onClick={onClose}>목록으로 돌아가기</button></div>
      </div>
    </dialog>
  );
}

function AdministrationDirection() {
  return (
    <details className="app-disclosure app-admin-direction">
      <summary><span>교직원 업무 연결 방향</span><span className="app-disclosure__hint">석암뷔페 · 석암 ON</span></summary>
      <div className="app-disclosure__body">
        <h3>업무의 시작을 석암뷔페에서.</h3>
        <p>석암뷔페를 교직원 업무의 중심 포털로 두고, 아래 도구에 바로 접근하는 구조를 검토합니다. 현재는 각 앱을 개별 바로가기로 이용할 수 있습니다.</p>
        <div className="app-shortcuts">{shortcutIds.map(id => projects.find(project => project.id === id)).map(project => project?.url ? (
          <a href={project.url} key={project.id} target="_blank" rel="noreferrer noopener">{project.name}<span aria-hidden="true">↗</span><span className="sr-only">, 새 창</span></a>
        ) : null)}</div>
        <div className="app-admin-direction__on"><strong>석암 ON은 자주 쓰는 핵심 기능을 중심으로</strong><p>보결관리와 정보화기기·컴퓨터 정보 수집 및 관리 기능을 먼저 드러내고, 나머지 기능은 석암뷔페의 관련 업무 메뉴로 연결하는 방향을 검토합니다.</p></div>
      </div>
    </details>
  );
}

export function AppWorkspace({ area, onNavigate }: AppWorkspaceProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('전체');
  const [page, setPage] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [resource, setResource] = useState<'gallery' | 'presentation' | null>(null);
  const currentArea = serviceAreas.find(item => item.id === area);
  const activeFeatures = featuredServices.filter(service => service.area === currentArea?.name);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(''); setGroup('전체'); setPage(0); setSelectedProject(null); setResource(null);
  }, [area]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase('ko').replace(/\s+/g, '');
    return projects.filter(project =>
      (!currentArea || project.category === currentArea.name) &&
      (group === '전체' || project.subgroup === group) &&
      [project.name, project.category, project.subgroup, project.summary, project.audience, project.relatedTo ?? '']
        .join(' ').toLocaleLowerCase('ko').replace(/\s+/g, '').includes(normalizedQuery));
  }, [currentArea, group, query]);

  const pageCount = Math.ceil(filteredProjects.length / pageSize);
  const visibleProjects = filteredProjects.slice(page * pageSize, (page + 1) * pageSize);
  const showResults = area !== 'all' || query.trim().length > 0;

  const changePage = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    listRef.current?.focus({ preventScroll: true });
  };

  return (
    <section className="app-workspace" data-area={area} aria-labelledby="app-workspace-title">
      <div className="app-shell">
        {currentArea && <nav className="app-area-nav" aria-label="앱 영역 선택">
          <button type="button" onClick={() => onNavigate('apps')}>전체 앱</button><span aria-hidden="true">/</span>
          {serviceAreas.map(item => <button type="button" aria-current={area === item.id ? 'page' : undefined} key={item.id} onClick={() => onNavigate(item.id)}>{item.name}</button>)}
        </nav>}

        <header className="app-heading">
          <div><p className="app-eyebrow">{currentArea?.eyebrow ?? 'TOOLS FOR OUR SCHOOL'}</p><h1 id="app-workspace-title">{currentArea?.name ?? '전체 앱'}<span className="app-heading__dot" aria-hidden="true">.</span></h1><p className="app-heading__description">{currentArea ? areaCopy[currentArea.id].description : '배움, 안전, 업무. 지금 필요한 영역부터 둘러보세요.'}</p></div>
          <div className="app-search"><label className="sr-only" htmlFor="app-search">앱 검색</label><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7" /><path d="m16 16 5 5" /></svg><input type="search" id="app-search" value={query} placeholder={currentArea ? `${currentArea.name} 앱 검색` : '앱 이름이나 필요한 기능 검색'} onChange={event => { setQuery(event.target.value); setPage(0); }} />{query && <button type="button" aria-label="검색 지우기" onClick={() => { setQuery(''); setPage(0); }}>×</button>}</div>
        </header>

        {area === 'all' && !query.trim() && <div className="app-domain-grid">
          {serviceAreas.map((item, index) => {
            const services = featuredServices.filter(service => service.area === item.name);
            const count = projects.filter(project => project.category === item.name).length;
            return <button type="button" className="app-domain-tile" data-area={item.id} key={item.id} onClick={() => onNavigate(item.id)} aria-label={`${item.name}, ${count}개 앱·기능 보기`}>
              <span className="app-domain-tile__top"><span>{String(index + 1).padStart(2, '0')}</span><span>{count}개 앱·기능</span></span>
              <span className="app-domain-tile__name">{item.name}</span><span className="app-domain-tile__tagline">{areaCopy[item.id].title}</span>
              <span className={`app-domain-tile__visual${services.length > 1 ? ' app-domain-tile__visual--pair' : ''}`}>{services.map(service => <img key={service.id} data-service={service.id} src={service.image} alt="" loading="lazy" decoding="async" />)}<span className="app-domain-tile__visual-label">{services.map(service => service.name).join(' · ')}</span></span>
              <span className="app-domain-tile__bottom"><span>영역 둘러보기</span><span aria-hidden="true">↗</span></span>
            </button>;
          })}
        </div>}

        {currentArea && !query.trim() && <>
          <div className={`app-feature-grid${activeFeatures.length > 1 ? ' app-feature-grid--pair' : ''}`}>
            {activeFeatures.map(service => <article className="app-feature" data-service={service.id} key={service.id}>
              <div className="app-feature__copy"><p className="app-eyebrow">대표 앱 <span aria-hidden="true">/</span> {service.category}</p><p className="app-feature__brand">{featuredVisualCopy[service.id].label}</p><h2>{service.name}</h2><p className="app-feature__headline">{featuredVisualCopy[service.id].headline}</p><p className="app-feature__description">{featuredCopy[service.id]}</p>
                <div className="app-feature__actions"><ExternalAction project={service} />{projects.find(project => project.id === service.id) && <button type="button" className="app-text-button" aria-label={`${service.name} 대표 앱 자세히 보기`} onClick={() => setSelectedProject(projects.find(project => project.id === service.id) ?? null)}>소개 보기</button>}</div>
              </div><div className="app-feature__image"><img src={service.image} alt={service.imageAlt} loading="eager" decoding="async" /><span className="app-feature__image-caption">{featuredVisualCopy[service.id].caption}</span></div>
            </article>)}
          </div>
          {area === 'student' && <div className="app-resources">
            <div className="app-resources__bar"><span>드라코니스 더 알아보기</span><div><button type="button" aria-label="드라코니스 소개 자료" aria-expanded={resource === 'presentation'} aria-controls="app-draconis-resources" onClick={() => setResource(resource === 'presentation' ? null : 'presentation')}><span className="app-resources__button-copy"><strong>소개 자료</strong><small>배움과 모험이 만나는 이야기</small></span><span className="app-resources__button-mark" aria-hidden="true">{resource === 'presentation' ? '−' : '↗'}</span></button><button type="button" aria-label="드라코니스 학습 화면" aria-expanded={resource === 'gallery'} aria-controls="app-draconis-resources" onClick={() => setResource(resource === 'gallery' ? null : 'gallery')}><span className="app-resources__button-copy"><strong>학습 화면</strong><small>실제 수업과 성장 과정 살펴보기</small></span><span className="app-resources__button-mark" aria-hidden="true">{resource === 'gallery' ? '−' : '↗'}</span></button></div></div>
            <div id="app-draconis-resources" hidden={!resource}>{resource === 'presentation' && <DraconisPresentation />}{resource === 'gallery' && <DraconisGallery />}</div>
          </div>}
        </>}

        {showResults && <div className="app-directory" ref={listRef} tabIndex={-1}>
          <div className="app-directory__toolbar">
            {currentArea && <div className="app-group-filter" role="group" aria-label="활용 목적">{['전체', ...currentArea.groups.map(item => item.name)].map(name => <button type="button" key={name} aria-pressed={group === name} onClick={() => { setGroup(name); setPage(0); }}>{name}</button>)}</div>}
            <p className="app-result-count" role="status">{query.trim() ? `“${query.trim()}” 검색 결과` : '앱·기능'} <strong>{filteredProjects.length}</strong></p>
          </div>
          {visibleProjects.length ? <div className="app-card-grid">{visibleProjects.map((project, index) => <article className="app-card" key={project.id} data-project={project.id} data-category={project.category}>
            <div className="app-card__top"><span className="app-card__number" aria-hidden="true">{String(page * pageSize + index + 1).padStart(2, '0')}</span><span>{area === 'all' ? project.category : project.audience}</span></div>
            <h3>{project.name}</h3><p className="app-card__summary">{project.summary}</p>
            <div className="app-card__bottom"><span className="app-card__relation">{project.id === 'draconis' && project.owner ? `담당 ${project.owner}` : project.relatedTo ?? (!project.url ? '연결 준비 중' : '')}</span><button type="button" onClick={() => setSelectedProject(project)} aria-label={`${project.name} 자세히 보기`}>자세히 보기 <span aria-hidden="true">↗</span></button></div>
          </article>)}</div> : <div className="app-empty"><h3>조건에 맞는 앱이 없습니다.</h3><p>다른 검색어를 입력하거나 활용 목적을 바꿔보세요.</p><button className="app-text-button" type="button" onClick={() => { setQuery(''); setGroup('전체'); setPage(0); }}>검색 조건 초기화</button></div>}
          {pageCount > 1 && <nav className="app-pagination" aria-label="앱 목록 페이지"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredProjects.length)} / {filteredProjects.length}</span><div><button type="button" aria-label="이전 앱 목록" disabled={page === 0} onClick={() => changePage(page - 1)}>←</button><span>{page + 1} / {pageCount}</span><button type="button" aria-label="다음 앱 목록" disabled={page + 1 >= pageCount} onClick={() => changePage(page + 1)}>→</button></div></nav>}
        </div>}
        {area === 'admin' && !query.trim() && <AdministrationDirection />}
        {area === 'all' && !query.trim() && <details className="app-disclosure app-archive"><summary><span>연구소 기록과 이전 프로젝트</span></summary><div className="app-disclosure__body app-archive__links">{legacyResources.map(item => <a href={item.url} key={item.id} target="_blank" rel="noreferrer noopener">{item.name}<span aria-hidden="true">↗</span><span className="sr-only">, 새 창</span></a>)}</div></details>}
      </div>
      {selectedProject && <AppDetail project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </section>
  );
}
