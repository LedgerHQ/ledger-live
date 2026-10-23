import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";

export function GetPortfolioSection(props: Readonly<RunProps>) {
  return (
    <Section
      title="Look at the portfolio"
      description="Its registrations, the accounts the service tracks, and the status of each."
    >
      <div className="flex gap-12">
        <ActionButton kind="getPortfolio" {...props} />
      </div>
    </Section>
  );
}
