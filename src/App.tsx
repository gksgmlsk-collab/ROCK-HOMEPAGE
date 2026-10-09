import { useEffect, useRef, useState } from 'react';
import { AboutWorkspace } from './components/AboutWorkspace';
import { AppWorkspace } from './components/AppWorkspace';
import { SiteHeader } from './components/SiteHeader';
import { ScrollWorld } from './components/ScrollWorld';
import { isAboutView, readSiteView, viewHashes, viewLabels, type SiteView } from './data/siteNavigation';

export default function App() {
  const [view, setView] = useState<SiteView>(readSiteView);
  const [navigationRevision, setNavigationRevision] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const sync = () => setView(readSiteView());
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    document.title = `${viewLabels[view]} · 돌 AI연구소`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (mounted.current) mainRef.current?.focus({ preventScroll: true });
    mounted.current = true;
  }, [view]);

  const navigate = (nextView: SiteView) => {
    if (window.location.hash !== viewHashes[nextView]) window.location.hash = viewHashes[nextView];
    setView(nextView);
    if (nextView === view) {
      setNavigationRevision(revision => revision + 1);
      window.scrollTo({ top: 0, behavior: 'auto' });
      mainRef.current?.focus({ preventScroll: true });
    }
  };

  if (view === 'intro') {
    return (
      <div className="intro-site">
        <header className="intro-masthead">
          <span className="intro-masthead__brand">DOL AI LAB <small>돌 AI연구소</small></span>
          <a href={viewHashes.about} className="intro-skip" onClick={event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); navigate('about');
          }}>홈페이지 바로가기 <span aria-hidden="true">↗</span></a>
        </header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="intro-main">
          <ScrollWorld onEnter={() => navigate('about')} />
        </main>
      </div>
    );
  }

  return (
    <div className="workspace-site">
      <a className="workspace-skip" href="#main-content" onClick={event => { event.preventDefault(); mainRef.current?.focus(); }}>본문 바로가기</a>
      <SiteHeader view={view} onNavigate={navigate} />
      <main className="workspace-main" id="main-content" ref={mainRef} tabIndex={-1}>
        {isAboutView(view) ? (
          <AboutWorkspace section={view === 'awards' ? 'awards' : view === 'organization' ? 'organization' : 'intro'} onNavigate={navigate} />
        ) : (
          <AppWorkspace key={`${view}-${navigationRevision}`} area={view === 'student' || view === 'safety' || view === 'admin' ? view : 'all'} onNavigate={navigate} />
        )}
      </main>
      <footer className="workspace-footer">
        <span><strong>DOL AI LAB</strong> 인천석암초등학교 돌 AI연구소</span>
        <a className="workspace-replay" href={viewHashes.intro} onClick={event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); navigate('intro');
        }}><span className="workspace-replay__icon" aria-hidden="true">▶</span>처음 소개영상 다시보기 <span aria-hidden="true">↗</span></a>
      </footer>
    </div>
  );
}
