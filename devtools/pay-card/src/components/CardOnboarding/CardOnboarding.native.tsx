import { ScrollView } from "react-native";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stepper,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardOnboardingStatusProps, PayCardOnboardingStatusStep } from "../../types";
import { Section } from "../Section/Section";

export interface CardOnboardingScreenProps extends PayCardOnboardingStatusProps {
  readonly onBack: () => void;
}

const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "s16",
} as const;
const STEPPER_LX = { alignItems: "center", gap: "s8" } as const;
const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  paddingVertical: "s4",
} as const;

function Step({
  step,
  setStepDone,
}: {
  readonly step: PayCardOnboardingStatusStep;
  readonly setStepDone: (id: string, done: boolean) => void;
}) {
  return (
    <Box lx={ROW_LX}>
      <Text typography="body3" lx={{ color: step.isDone ? "success" : "muted" }}>
        {step.isDone ? "done" : "open"}
      </Text>
      <Box lx={{ flex: 1 }}>
        {/* The id is the whole step: copy belongs to whatever renders it for a holder. */}
        <Text typography="body3" lx={{ color: "base" }}>
          {step.id}
        </Text>
      </Box>
      {step.canToggle ? (
        <Switch
          checked={step.isDone}
          onCheckedChange={done => setStepDone(step.id, done)}
          accessibilityLabel={step.id}
        />
      ) : null}
    </Box>
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
    <ScrollView>
      <Box lx={HEADER_LX}>
        <Button appearance="gray" size="sm" onPress={onBack}>
          Back
        </Button>
        <IconButton
          icon={Refresh}
          appearance="no-background"
          size="sm"
          loading={isFetching}
          onPress={refresh}
          accessibilityLabel="Refresh"
        />
      </Box>

      <Section title="Card onboarding">
        <Box lx={STEPPER_LX}>
          <Stepper currentStep={completedCount} totalSteps={steps.length} />
        </Box>

        {error === undefined ? null : (
          <Text typography="body3" lx={{ color: "error" }}>
            {error}
          </Text>
        )}

        <Divider />
        {steps.map(step => (
          <Step key={step.id} step={step} setStepDone={setStepDone} />
        ))}
      </Section>

      <Section title="Mocked answers">
        {isMockingEnabled ? (
          <>
            <Text typography="body3" lx={{ color: "muted" }}>
              A step is set by mocking the endpoint it is read from, so the answer holds until it is
              cleared. The purchase step has no toggle: nothing answers it yet.
            </Text>
            <Button appearance="gray" size="sm" onPress={clearMocks}>
              Use the real answers
            </Button>
          </>
        ) : (
          <Text typography="body3" lx={{ color: "warning" }}>
            Request mocking is off, so the endpoint steps cannot be set. Restart with
            MSW_ENABLED=true to turn it on.
          </Text>
        )}
      </Section>

      {/* The steps are worked out, not fetched, so the answer itself is the thing to check. */}
      <Section title="Derived response">
        <Text typography="body3" lx={{ color: "base" }}>
          {raw}
        </Text>
      </Section>
    </ScrollView>
  );
}
