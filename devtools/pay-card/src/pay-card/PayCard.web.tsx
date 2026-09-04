import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";

export function PayCard(props: Readonly<PayCardToolProps>) {
  const {
    flags,
    onboarding,
    hasSeenFeatureTour,
    resetPayCardFeatureTourSeen,
    hasSeenReceiveVerifyHint,
    resetReceiveVerifyHintSeen,
    onNavigateToPortfolio,
    onNavigateToPayTab,
  } = props;

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section title="Feature flags">
        <ToggleRow
          label="Pay tab"
          description="lwdPayTab / lwmPayTab"
          checked={flags.payTabEnabled}
          onChange={flags.setPayTabEnabled}
        />
        <ToggleRow
          label="Card param"
          description="params.card"
          checked={flags.cardParam}
          onChange={flags.setCardParam}
        />
        <ToggleRow
          label="Legacy Card"
          description="ptxCard"
          checked={flags.ptxCardEnabled}
          onChange={flags.setPtxCardEnabled}
        />
      </Section>

      <Divider />

      <Section title="Onboarding">
        <div className="flex flex-col gap-2">
          {onboarding.steps.map(step => (
            <ToggleRow
              key={step.id}
              label={step.label}
              checked={step.done}
              onChange={() => onboarding.setStepDone(step.id, !step.done)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      <Section title="Reset onboarding">
        <div className="flex flex-wrap gap-8">
          <Button appearance="gray" size="sm" onClick={() => onboarding.setStepDone("all", false)}>
            Reset onboarding widget
          </Button>
        </div>
      </Section>

      <Divider />

      <SeenReset
        title="Feature tour"
        seen={hasSeenFeatureTour}
        resetLabel="Reset feature tour"
        onReset={resetPayCardFeatureTourSeen}
      />

      <Divider />

      <SeenReset
        title="Request verify hint"
        seen={hasSeenReceiveVerifyHint}
        resetLabel="Reset verify hint"
        onReset={resetReceiveVerifyHintSeen}
      />

      {onNavigateToPortfolio || onNavigateToPayTab ? (
        <>
          <Divider />
          <Section title="Quick actions">
            <div className="flex flex-wrap gap-8">
              {onNavigateToPortfolio ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToPortfolio}>
                  Go to Portfolio
                </Button>
              ) : null}
              {onNavigateToPayTab ? (
                <Button appearance="gray" size="sm" onClick={onNavigateToPayTab}>
                  Go to Pay tab
                </Button>
              ) : null}
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function SeenReset({
  title,
  seen,
  resetLabel,
  onReset,
}: Readonly<{
  title: string;
  seen: boolean;
  resetLabel: string;
  onReset: () => void;
}>) {
  return (
    <Section title={title}>
      <div>
        <Tag size="sm" appearance={seen ? "success" : "gray"} label={seen ? "Seen" : "Not seen"} />
      </div>
      <div className="flex flex-wrap gap-8">
        <Button appearance="gray" size="sm" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </Section>
  );
}

export default PayCard;
