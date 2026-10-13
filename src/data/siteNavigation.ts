export type SiteView = 'intro' | 'about' | 'awards' | 'organization' | 'apps' | 'student' | 'safety' | 'admin';

export const viewHashes: Record<SiteView, string> = {
  intro: '#/intro',
  about: '#/about',
  awards: '#/about/awards',
  organization: '#/about/organization',
  apps: '#/apps',
  student: '#/apps/student',
  safety: '#/apps/safety',
  admin: '#/apps/admin',
};

export const viewLabels: Record<SiteView, string> = {
  intro: '학교의 내일을 만나는 여정',
  about: '연구소 소개', awards: '연구소 수상', organization: '운영조직',
  apps: '전체 앱', student: '학생지원', safety: '학교안전', admin: '학교행정',
};

const legacyViews: Record<string, SiteView> = {
  '#journey-start': 'intro', '#lab-intro': 'about', '#lab-awards': 'awards',
  '#lab-organization': 'organization', '#lab-featured': 'apps', '#lab-services': 'apps',
  '#lab-student': 'student', '#portfolio-student': 'student',
  '#lab-safety': 'safety', '#portfolio-safety': 'safety',
  '#lab-admin': 'admin', '#portfolio-admin': 'admin',
};

export function readSiteView(): SiteView {
  const hash = window.location.hash;
  return (Object.keys(viewHashes) as SiteView[]).find(view => viewHashes[view] === hash)
    ?? legacyViews[hash] ?? 'intro';
}

/** A newly opened homepage starts with the film, including saved about links.
 * In-page navigation still uses readSiteView so entering the homepage works normally. */
export function readInitialSiteView(): SiteView {
  const requestedView = readSiteView();
  return requestedView === 'about' ? 'intro' : requestedView;
}

export const isAboutView = (view: SiteView) => ['about', 'awards', 'organization'].includes(view);
