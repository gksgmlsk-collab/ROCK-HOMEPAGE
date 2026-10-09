import { type MouseEvent } from 'react';
import { awards, organization, projects } from '../data/labContent';
import { scenes } from '../data/scenes';
import { AwardsShowcase } from './AwardsShowcase';

type AboutSection = 'intro' | 'awards' | 'organization';
type AboutDestination = 'about' | 'awards' | 'organization' | 'apps' | 'student' | 'safety' | 'admin';
type AboutWorkspaceProps = {
  section: AboutSection;
  onNavigate: (view: AboutDestination) => void;
};

const aboutTabs: Array<{ section: AboutSection; view: AboutDestination; label: string; href: string }> = [
  { section: 'intro', view: 'about', label: '연구소 소개', href: '#/about' },
  { section: 'awards', view: 'awards', label: '연구소 수상', href: '#/about/awards' },
  { section: 'organization', view: 'organization', label: '운영조직', href: '#/about/organization' },
];

const homeHighlights: Array<{ view: AboutDestination; label: string; count: number; unit: string; caption: string; href: string }> = [
  { view: 'student', label: '학생지원', count: projects.filter(project => project.category === '학생지원').length, unit: '앱·기능', caption: '드라코니스와 함께하는 배움', href: '#/apps/student' },
  { view: 'safety', label: '학교안전', count: projects.filter(project => project.category === '학교안전').length, unit: '앱', caption: '반경너머에서 시작하는 안심', href: '#/apps/safety' },
  { view: 'admin', label: '학교행정', count: projects.filter(project => project.category === '학교행정').length, unit: '앱', caption: '돌쇠·석암 뷔페가 돕는 학교 업무', href: '#/apps/admin' },
  { view: 'awards', label: '연구소 수상', count: awards.length, unit: '수상', caption: '법제처장상(왕중왕전 진출) · 교육부장관상', href: '#/about/awards' },
];

export function AboutWorkspace({ section, onNavigate }: AboutWorkspaceProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>, destination: AboutDestination) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(destination);
  };

  return (
    <div className="about-workspace" data-section={section}>
      {section !== 'intro' && <div className="about-topline">
        <p className="about-kicker">OUR LABORATORY</p>
        <nav className="about-tabs" aria-label="연구소 소개 상세 메뉴">
          {aboutTabs.map(tab => (
            <a key={tab.section} href={tab.href} aria-current={section === tab.section ? 'page' : undefined}
              onClick={event => navigate(event, tab.view)}>{tab.label}</a>
          ))}
        </nav>
      </div>}

      {section === 'intro' && (
        <section className="about-intro" aria-labelledby="about-title">
          <div className="about-hero">
            <img className="about-hero__background" src={scenes[0].sourceImage} alt={scenes[0].alt} fetchPriority="high" />
            <div className="about-hero__shade" aria-hidden="true" />
            <div className="about-hero__copy">
              <p className="about-eyebrow">DOL AI LAB <span aria-hidden="true">·</span> 인천석암초등학교</p>
              <h1 id="about-title">학교의 문제를,<br /><em>AI</em>로 해결합니다.</h1>
              <p className="about-hero__description">학교 현장을 가장 잘 아는 사람들이 직접 만듭니다.</p>
              <p className="about-hero__body">학생의 배움, 학교의 안전, 교직원의 업무까지.<br />학교에 필요한 변화를 실제 서비스로 연결합니다.</p>
              <div className="about-hero__actions">
                <a className="about-primary-action" href="#/apps" onClick={event => navigate(event, 'apps')}>앱 둘러보기 <span aria-hidden="true">↗</span></a>
                <a className="about-secondary-action" href="#/about/awards" onClick={event => navigate(event, 'awards')}>연구소 수상 <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <p className="about-hero__signature">AI FOR EDUCATION, TOGETHER.</p>
          </div>
          <nav className="about-highlights" aria-label="학교를 위한 도구와 연구 성과">
            {homeHighlights.map((highlight, index) => (
              <a key={highlight.view} data-highlight={highlight.view} href={highlight.href} onClick={event => navigate(event, highlight.view)}>
                <p className="about-highlight__metric"><strong className="about-highlight__value">{highlight.count}</strong><span>{highlight.unit}</span></p>
                <div className="about-highlight__heading"><span className="about-highlight__index">0{index + 1}</span><h2>{highlight.label}</h2><span className="about-highlight__arrow" aria-hidden="true">↗</span></div>
                <p className="about-highlight__caption">{highlight.caption}</p>
              </a>
            ))}
          </nav>
        </section>
      )}

      {section === 'awards' && <AwardsShowcase />}

      {section === 'organization' && (
        <section className="about-organization" aria-labelledby="about-title">
          <header className="about-page-heading">
            <div><p className="about-eyebrow">PEOPLE &amp; TEAMS</p><h1 id="about-title">함께 만드는<br />학교의 다음 모습.</h1></div>
            <p>교육, 개발, 운영의 경험을 연결해<br />우리 학교에 필요한 변화를 만듭니다.</p>
          </header>
          <div className="about-organization__layout">
            <div className="about-roster">
              <p className="about-kicker">DOL AI LAB MEMBERS</p>
              <dl>{organization.groups.map(group => <div key={group.role}><dt>{group.role}</dt><dd>{group.names.map(name => <span key={name}>{name}</span>)}</dd></div>)}</dl>
            </div>
            <div className="about-departments">
              {organization.departments.map((department, index) => (
                <article key={department.title}>
                  <div className="about-department__heading"><span>0{index + 1}</span><p>{department.lead} 팀장</p></div>
                  <h2>{department.title}</h2>
                  <p>{department.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
