import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { PayCardToolProps } from "../types";
import { Section } from "../components/Section/Section";
import { ToggleRow } from "../components/ToggleRow/ToggleRow";
import { EnvVarRow } from "../components/EnvVarRow/EnvVarRow";

export function PayCard(props: Readonly<PayCardToolProps>) {
  const { flags, onboarding, hasSeenFeatureTour, resetPayCardFeatureTourSeen, env } = props;

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

      <Section title="Feature tour">
        <div>
          <Tag
            size="sm"
            appearance={hasSeenFeatureTour ? "success" : "gray"}
            label={hasSeenFeatureTour ? "Seen" : "Not seen"}
          />
        </div>
        <div className="flex flex-wrap gap-8">
          <Button appearance="gray" size="sm" onClick={resetPayCardFeatureTourSeen}>
            Reset feature tour
          </Button>
        </div>
      </Section>

      <Divider />

      <Section title="Env vars">
        <p className="body-4 text-muted">
          Applied at once, and not saved: a restart brings the build's values back.
        </p>
        {env.vars.map(envVar => (
          <EnvVarRow key={envVar.key} envVar={envVar} onSet={env.setVar} />
        ))}
      </Section>
    </div>
  );
}

export default PayCard;
