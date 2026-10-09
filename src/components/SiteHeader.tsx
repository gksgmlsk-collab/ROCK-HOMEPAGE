import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { isAboutView, viewHashes, type SiteView } from '../data/siteNavigation';

type MenuName = 'about' | 'apps';
type MenuItem = { view: SiteView; title: string; description: string; number: string };
const menus: Record<MenuName, MenuItem[]> = {
  about: [
    { view: 'about', title: '연구소 소개', description: '학교에서 시작하는 변화', number: '01' },
    { view: 'awards', title: '연구소 수상', description: '현장의 문제를 풀어낸 성과', number: '02' },
    { view: 'organization', title: '운영조직', description: '함께 만들고 다듬는 사람들', number: '03' },
  ],
  apps: [
    { view: 'student', title: '학생지원', description: '배움과 성장을 돕는 앱', number: '01' },
    { view: 'safety', title: '학교안전', description: '안전한 학교의 일상을 위해', number: '02' },
    { view: 'admin', title: '학교행정', description: '교직원의 일을 더 가볍게', number: '03' },
  ],
};

export function SiteHeader({ view, onNavigate }: { view: SiteView; onNavigate: (view: SiteView) => void }) {
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLButtonElement>(null);
  const appsRef = useRef<HTMLButtonElement>(null);
  const focusFirst = useRef(false);
  const activeMenu = isAboutView(view) ? 'about' : 'apps';

  useEffect(() => { setOpenMenu(null); }, [view]);
  useEffect(() => {
    if (!openMenu) return;
    if (focusFirst.current) {
      headerRef.current?.querySelector<HTMLAnchorElement>('.site-menu-grid a')?.focus();
      focusFirst.current = false;
    }
    const closeOutside = (event: Event) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        (openMenu === 'about' ? aboutRef : appsRef).current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [openMenu]);

  const follow = (event: MouseEvent<HTMLAnchorElement>, nextView: SiteView) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpenMenu(null);
    onNavigate(nextView);
  };

  return (
    <header className="site-header workspace-header" ref={headerRef}>
      <div className="workspace-header__inner">
        <a className="workspace-brand" href={viewHashes.about} aria-label="DOL AI LAB 홈페이지" onClick={event => follow(event, 'about')}>
          <span className="workspace-brand__mark" aria-hidden="true">D<span>·</span></span>
          <span><strong>DOL AI LAB</strong><small>돌 AI연구소</small></span>
        </a>
        <nav className="site-header__nav workspace-nav" aria-label="주요 메뉴">
          {(['about', 'apps'] as const).map(menu => (
            <button type="button" key={menu} ref={menu === 'about' ? aboutRef : appsRef}
              data-menu={menu}
              className={activeMenu === menu ? 'is-active' : ''}
              aria-expanded={openMenu === menu} aria-controls={`nav-panel-${menu}`}
              onClick={() => setOpenMenu(previous => previous === menu ? null : menu)}
              onKeyDown={event => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  if (openMenu === menu) headerRef.current?.querySelector<HTMLAnchorElement>('.site-menu-grid a')?.focus();
                  else { focusFirst.current = true; setOpenMenu(menu); }
                }
              }}>
              {menu === 'about' ? '연구소 소개' : '전체 앱'}
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
          ))}
        </nav>
      </div>
      {openMenu && (
        <div className="site-menu-panel" id={`nav-panel-${openMenu}`} role="region" aria-label={`${openMenu === 'about' ? '연구소 소개' : '전체 앱'} 하위 메뉴`}>
          <div className="site-menu-panel__inner">
            <div className="site-menu-panel__heading">
              <span>{openMenu === 'about' ? 'ABOUT THE LAB' : 'EXPLORE OUR APPS'}</span>
              {openMenu === 'apps' && <a href={viewHashes.apps} onClick={event => follow(event, 'apps')}>전체 앱 한눈에 보기 <span aria-hidden="true">↗</span></a>}
            </div>
            <div className="site-menu-grid">
              {menus[openMenu].map(item => (
                <a href={viewHashes[item.view]} key={item.view} aria-current={view === item.view ? 'page' : undefined}
                  onClick={event => follow(event, item.view)}>
                  <span className="site-menu-item__number">{item.number}</span>
                  <span><strong>{item.title}</strong><small>{item.description}</small></span>
                  <span className="site-menu-item__arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
