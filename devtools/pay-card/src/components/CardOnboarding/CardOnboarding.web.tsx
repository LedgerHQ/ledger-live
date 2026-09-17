import { Button, Divider, IconButton, Stepper, Switch } from "@ledgerhq/lumen-ui-react";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardOnboardingStatusProps, PayCardOnboardingStatusStep } from "../../types";
import { Section } from "../Section/Section";

export interface CardOnboardingScreenProps extends PayCardOnboardingStatusProps {
  readonly onBack: () => void;
}

function Step({
  step,
  setStepDone,
}: {
  readonly step: PayCardOnboardingStatusStep;
  readonly setStepDone: (id: string, done: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-8 py-4">
      <span className={`body-3 ${step.isDone ? "text-success" : "text-muted"}`}>
        {step.isDone ? "done" : "open"}
      </span>
      {/* The id is the whole step: copy belongs to whatever renders it for a holder. */}
      <span className="body-3 text-base grow">{step.id}</span>
      {step.canToggle ? (
        <Switch
          selected={step.isDone}
          onChange={done => setStepDone(step.id, done)}
          aria-label={step.id}
        />
      ) : null}
    </div>
  );
}

export function CardOnboardingScreen({
  steps,
  completedCount,
  isFetching,
  error,
  raw,
  refresh,
  setStepDone,
  clearMocks,
  isMockingEnabled,
  onBack,
}: CardOnboardingScreenProps) {
  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-16">
        <Button appearance="gray" size="sm" onClick={onBack}>
          Back
        </Button>
        <IconButton
          icon={Refresh}
          appearance="no-background"
          size="sm"
          loading={isFetching}
          onClick={refresh}
          aria-label="Refresh"
        />
      </div>

      <Section title="Card onboarding">
        <div className="flex items-center gap-8">
          <Stepper currentStep={completedCount} totalSteps={steps.length} />
        </div>

        {error === undefined ? null : <p className="body-3 text-error">{error}</p>}

        <Divider />
        {steps.map(step => (
          <Step key={step.id} step={step} setStepDone={setStepDone} />
        ))}
      </Section>

      <Section title="Mocked answers">
        {isMockingEnabled ? (
          <>
            <p className="body-3 text-muted">
              A step is set by mocking the endpoint it is read from, so the answer holds until it is
              cleared. The purchase step has no toggle: nothing answers it yet.
            </p>
            <Button appearance="gray" size="sm" onClick={clearMocks}>
              Use the real answers
            </Button>
          </>
        ) : (
          <p className="body-3 text-warning">
            Request mocking is off, so the endpoint steps cannot be set. Restart with
            ENABLE_MSW=true to turn it on.
          </p>
        )}
      </Section>

      {/* The steps are worked out, not fetched, so the answer itself is the thing to check. */}
      <Section title="Derived response">
        <pre className="body-3 text-base whitespace-pre-wrap break-all">{raw}</pre>
      </Section>
    </div>
  );
}
