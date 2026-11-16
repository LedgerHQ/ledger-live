import { useEffect, type ReactNode } from "react";
import { ScrollView } from "react-native";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { PredictionsOnboardingState, PredictionsToolProps } from "../types";
import { describeAddress, describeVersions, RESETS, setupPreviews } from "./describe";
import { useAction } from "./useAction";

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <Box lx={{ gap: "s8" }}>
      <Text typography="body2SemiBold">{title}</Text>
      {children}
    </Box>
  );
}

function Muted({
  children,
  isSelectable,
}: Readonly<{ children: ReactNode; isSelectable?: boolean }>) {
  return (
    <Text typography="body3" lx={{ color: "muted" }} selectable={isSelectable}>
      {children}
    </Text>
  );
}

function Environment({
  state,
  isRunning,
  onReset,
}: Readonly<{
  state: PredictionsOnboardingState;
  isRunning: boolean;
  onReset: (reset: (typeof RESETS)[number]) => void;
}>) {
  return (
    <Section title={`${state.label} (${state.manifestId})`}>
      {state.isStored ? (
        <>
          <Muted>Documents: {describeVersions(state.acceptedVersions)}</Muted>
          {state.addresses.length === 0 ? (
            <Muted>Accounts: none</Muted>
          ) : (
            state.addresses.map(linked => (
              <Muted key={linked.address}>{describeAddress(linked)}</Muted>
            ))
          )}
        </>
      ) : (
        <Muted>Nothing stored: the next open is a first open.</Muted>
      )}
      {RESETS.map(reset => (
        <Button
          key={reset.what}
          appearance="gray"
          size="sm"
          disabled={isRunning || !reset.isAvailable(state)}
          onPress={() => onReset(reset)}
        >
          {reset.label}
        </Button>
      ))}
      {state.raw === undefined ? null : <Muted isSelectable>Stored value: {state.raw}</Muted>}
    </Section>
  );
}

export default function Predictions({
  hasSeenIntro,
  setIntroSeen,
  onboardingStates,
  refresh,
  reset,
  replayWholeOnboarding,
  setupFailureReasons,
  previewSetup,
}: PredictionsToolProps) {
  const { isRunning, outcome, run } = useAction();

  useEffect(() => {
    run(refresh);
  }, [run, refresh]);

  return (
    <ScrollView>
      <Box lx={{ gap: "s24", padding: "s16" }}>
        <Section title="Onboarding">
          <Muted>Intro: {hasSeenIntro ? "seen" : "not seen"}</Muted>
          <Button appearance="gray" size="sm" onPress={() => setIntroSeen(!hasSeenIntro)}>
            {hasSeenIntro ? "Show the intro again" : "Mark the intro as seen"}
          </Button>
          <Button
            appearance="base"
            size="sm"
            disabled={isRunning}
            onPress={() =>
              run(replayWholeOnboarding, "Done. Reopen Predictions to replay the whole onboarding.")
            }
          >
            Replay the whole onboarding
          </Button>
          <Button
            appearance="transparent"
            size="sm"
            disabled={isRunning}
            onPress={() => run(refresh, "Refreshed.")}
          >
            Refresh
          </Button>
        </Section>
        {onboardingStates.map(state => (
          <Environment
            key={state.manifestId}
            state={state}
            isRunning={isRunning}
            onReset={({ what, done }) =>
              run(
                () => reset(state.manifestId, what),
                `Done. Reopen Predictions on ${state.label}: ${done}`,
              )
            }
          />
        ))}
        <Section title="Trading wallet setup">
          <Muted>
            Opens Ledger Wallet&apos;s setup as after a binding, then shows the outcome.
          </Muted>
          {setupPreviews(setupFailureReasons).map(({ label, preview }) => (
            <Button key={label} appearance="gray" size="sm" onPress={() => previewSetup(preview)}>
              {label}
            </Button>
          ))}
        </Section>
        {outcome ? (
          <Text typography="body3" lx={{ color: outcome.isError ? "error" : "success" }}>
            {outcome.message}
          </Text>
        ) : null}
      </Box>
    </ScrollView>
  );
}
