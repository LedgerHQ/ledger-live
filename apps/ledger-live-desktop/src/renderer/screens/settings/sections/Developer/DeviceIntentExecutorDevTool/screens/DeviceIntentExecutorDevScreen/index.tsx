import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  createIntent,
  type DeviceConnectionParams,
  type DeviceIntentExecutorProps,
  type ExecutorState,
} from "@ledgerhq/device-intent";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import {
  DeviceIntentExecutorLWD,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import type { InitializerConfig } from "LLD/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWD";
import { INITIALIZATION_SCENARIOS } from "../../initializationScenarios";
import { initializationEchoIntentLWDDefinition } from "../../intents/initializationEchoIntent/intentLWDDefinition";
import type {
  InitializationEchoIntentInput,
  InitializationEchoIntentJobState,
} from "../../intents/initializationEchoIntent/types";

type InitializationExecutorProps = DeviceIntentExecutorProps<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput,
  Record<string, never>,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
};

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
};

const initializationIntent = createIntent(initializationEchoIntentLWDDefinition, undefined);

export default function DeviceIntentExecutorDevScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col p-8 pb-16"
      data-testid="device-intent-executor-dev-screen"
    >
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button
            size="sm"
            appearance="no-background"
            onClick={() => navigate("/settings/developer")}
            icon={ArrowLeft}
          >
            Back
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,34rem)] text-center text-base">
          Device Intent Executor playground
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-4">
        <p className="body-2 text-muted">
          Exercises the desktop Device Intent Executor dialog. Use the dialog&apos;s placeholder
          buttons to simulate connection and initialization while the real LWD platform components
          are still being implemented.
        </p>

        <InitializationMode />
      </main>
    </div>
  );
}

function InitializationMode() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(INITIALIZATION_SCENARIOS[0].id);
  const [enabled, setEnabled] = useState(false);
  const [executorState, setExecutorState] = useState<ExecutorState | null>(null);
  const [latestJobState, setLatestJobState] = useState<InitializationEchoIntentJobState | null>(
    null,
  );
  const [jobCompleted, setJobCompleted] = useState(false);
  const [jobError, setJobError] = useState<unknown>(null);

  const selectedScenario =
    INITIALIZATION_SCENARIOS.find(scenario => scenario.id === selectedScenarioId) ??
    INITIALIZATION_SCENARIOS[0];

  const resetRunState = useCallback(() => {
    setExecutorState(null);
    setLatestJobState(null);
    setJobCompleted(false);
    setJobError(null);
  }, []);

  const handleUserCancel = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  const executorProps = useMemo<InitializationExecutorProps>(
    () => ({
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      deviceInitializationInput: selectedScenario.input,
      initializerConfig: selectedScenario.initializerConfig,
      intent: initializationIntent,
      intentComponentExtraProps: {},
      onExecutorStateChanged: setExecutorState,
      onIntentJobStateChanged: setLatestJobState,
      onIntentJobComplete: () => {
        setJobCompleted(true);
      },
      onIntentJobError: (error: unknown) => {
        setJobError(error);
      },
      cancelIntentRequestId: undefined,
      onUserCancel: handleUserCancel,
    }),
    [handleUserCancel, selectedScenario],
  );

  const selectScenario = useCallback(
    (scenarioId: string) => {
      if (enabled) return;
      setSelectedScenarioId(scenarioId);
      resetRunState();
    },
    [enabled, resetRunState],
  );

  const start = useCallback(() => {
    resetRunState();
    setEnabled(true);
  }, [resetRunState]);

  const stop = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  return (
    <>
      <section className="flex w-full flex-col gap-16 rounded-lg bg-surface p-16">
        <h2 className="body-2-semi-bold text-base">Initialization mode</h2>
        <p className="body-2 text-muted">
          Mirrors the mobile initialization playground with the same scenario inputs. The current
          LWD initializer placeholder displays these params and lets you simulate the extracted
          context.
        </p>

        <StateCard>
          <StateRow label="Selected scenario" value={selectedScenario.title} />
          <StateRow label="Executor" value={executorState?.type ?? "-"} />
          <StateRow label="Job completed" value={jobCompleted ? "YES" : "no"} />
          <StateRow label="Job error" value={formatError(jobError)} />
        </StateCard>

        <SummaryBox label="Input" value={selectedScenario.inputSummary} />
        <SummaryBox label="Initializer config" value={selectedScenario.initializerConfigSummary} />

        <SettingSection title="Scenarios">
          {INITIALIZATION_SCENARIOS.map(scenario => (
            <ChoiceButton
              key={scenario.id}
              label={scenario.title}
              selected={scenario.id === selectedScenario.id}
              disabled={enabled}
              onPress={() => selectScenario(scenario.id)}
            />
          ))}
        </SettingSection>

        <RawDetails title="Raw initialization input" value={selectedScenario.input} />

        {latestJobState ? (
          <RawDetails title="Latest echo job state" value={latestJobState} />
        ) : null}

        <Button appearance={enabled ? "red" : "base"} size="lg" onClick={enabled ? stop : start}>
          {enabled ? "Stop initialization" : "Start initialization"}
        </Button>
      </section>

      {enabled ? <DeviceIntentExecutorLWD {...executorProps} /> : null}
    </>
  );
}

function StateCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col gap-8 rounded-md bg-muted p-12">{children}</div>;
}

function StateRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-row justify-between gap-16">
      <span className="body-2 text-muted">{label}</span>
      <span className="body-2-semi-bold min-w-0 break-words text-right text-base">{value}</span>
    </div>
  );
}

function SettingSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-8">
      <span className="body-2 text-muted">{title}</span>
      <div className="flex flex-row flex-wrap items-center gap-8">{children}</div>
    </div>
  );
}

function ChoiceButton({
  label,
  selected,
  disabled,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}>) {
  return (
    <Button appearance={selected ? "base" : "gray"} size="sm" disabled={disabled} onClick={onPress}>
      {label}
    </Button>
  );
}

function SummaryBox({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-4 rounded-md bg-muted p-12">
      <span className="body-2-semi-bold text-base">{label}</span>
      <span className="body-2 text-muted whitespace-pre-line">{value}</span>
    </div>
  );
}

function RawDetails({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <div className="flex flex-col gap-8">
      <span className="body-2 text-muted">{title}</span>
      <pre className="max-h-[260px] overflow-auto rounded-md bg-muted p-12 text-xs text-base">
        {formatJson(value)}
      </pre>
    </div>
  );
}

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? "";
}

function formatError(error: unknown): string {
  if (!error) return "-";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}
