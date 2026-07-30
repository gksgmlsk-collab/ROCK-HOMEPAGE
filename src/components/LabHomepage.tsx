import { AwardsSection } from './AwardsSection';
import { FeaturedServices } from './FeaturedServices';
import { LabIntroSection } from './LabIntroSection';
import { OrganizationSection } from './OrganizationSection';
import { PortfolioSection } from './PortfolioSection';

export function LabHomepage() {
  return (
    <>
      <LabIntroSection />
      <FeaturedServices />
      <AwardsSection />
      <PortfolioSection />
      <OrganizationSection />
    </>
  );
}
