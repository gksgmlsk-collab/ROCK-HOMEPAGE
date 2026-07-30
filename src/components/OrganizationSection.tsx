import { organization } from '../data/labContent';

export function OrganizationSection() {
  return (
    <section
      className="content-section organization-section"
      id="lab-organization"
      aria-labelledby="organization-title"
    >
      <div className="content-shell">
        <div className="organization">
          <header className="subsection-heading subsection-heading--light">
            <p>PEOPLE &amp; TEAMS</p>
            <h2 id="organization-title">운영조직</h2>
            <span>현장 전문성이 연결되는 협업 구조입니다.</span>
          </header>

          <div className="organization__layout">
            <dl className="organization__roster">
              {organization.groups.map((group) => (
                <div key={group.role}>
                  <dt>{group.role}</dt>
                  <dd>
                    {group.names.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="organization__departments">
              {organization.departments.map((department, index) => (
                <article key={department.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p>{department.lead} 팀장</p>
                    <h3>{department.title}</h3>
                    <p>{department.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
