import { ActionButton, type RunProps } from "../../../components/ActionButton/ActionButton";
import { Section } from "../../../components/Section/Section";
import { StepBadge } from "../../../components/StepBadge/StepBadge";
import type { AccountPortfolioViewModel } from "../../../account-portfolio/viewModelTypes";

export function CreateSection(
  props: Readonly<RunProps & Pick<AccountPortfolioViewModel, "progress" | "nextStep">>,
) {
  return (
    <Section
      title="Create the portfolio"
      description="Makes an empty portfolio on the service. Do it once for this id."
      badge={
        <StepBadge
          done={props.progress.created}
          nextLabel={props.nextStep === "createPortfolio" ? "Start here" : undefined}
        />
      }
    >
      <div className="flex gap-12">
        <ActionButton kind="createPortfolio" appearance="base" {...props} />
      </div>
    </Section>
  );
}
