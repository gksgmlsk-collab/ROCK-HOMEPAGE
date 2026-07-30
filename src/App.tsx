import { LabHomepage } from './components/LabHomepage';
import { ScrollWorld } from './components/ScrollWorld';
import { SiteHeader } from './components/SiteHeader';

export default function App() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell" id="main-content">
        <ScrollWorld />
        <LabHomepage />
      </main>
      <footer className="site-footer">
        <div>
          <strong>DOL AI LAB</strong>
          <p>AI는 도구일 뿐, 교육의 중심은 언제나 사람입니다.</p>
        </div>
        <a href="#journey-start">처음으로</a>
      </footer>
    </>
  );
}
