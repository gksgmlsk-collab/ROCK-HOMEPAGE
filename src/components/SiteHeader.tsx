import { useEffect, useState } from 'react';
import { primaryNavigation } from '../data/labContent';

export function SiteHeader() {
  const [activeHref, setActiveHref] = useState<string>('');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = window.scrollY + Math.min(window.innerHeight * 0.34, 240);
      let next = '';

      for (const item of primaryNavigation) {
        const section = document.querySelector<HTMLElement>(item.href);
        if (section && marker >= section.offsetTop) next = item.href;
      }

      setActiveHref(next);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#journey-start" aria-label="DOL AI LAB 첫 화면">
          <span className="site-header__brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>DOL AI LAB</strong>
            <small>돌 AI연구소</small>
          </span>
        </a>

        <nav className="site-header__nav" aria-label="주요 메뉴">
          {primaryNavigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={activeHref === item.href ? 'is-active' : ''}
              aria-current={activeHref === item.href ? 'location' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
