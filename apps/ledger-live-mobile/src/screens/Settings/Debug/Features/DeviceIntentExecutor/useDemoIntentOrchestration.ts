import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createIntent,
  type DeviceIntentExecutorProps,
  type DeviceConnectionParams,
  type ExecutorState,
  type RequiredDeviceContext,
} from "@ledgerhq/device-intent";
import type {
  AnyDemoJobState,
  AnyDemoInput,
  AnyDemoIntent,
  AnyDemoExtraProps,
  DemoIntentDefinitions,
  DemoPhase,
} from "./intents/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
};

const BOLOS_CONTEXT: RequiredDeviceContext = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: true,
};

const ETHEREUM_CONTEXT: RequiredDeviceContext = {
  ...BOLOS_CONTEXT,
  appName: "Ethereum",
};

const BITCOIN_CONTEXT: RequiredDeviceContext = {
  ...BOLOS_CONTEXT,
  appName: "Bitcoin",
};

// ---------------------------------------------------------------------------
// Phase progression map
// ---------------------------------------------------------------------------

type ActivePhase = Exclude<DemoPhase["phase"], "idle" | "completed">;

const NEXT_PHASE: Record<ActivePhase, DemoPhase["phase"]> = {
  timer: "legacy-get-address-eth",
  "legacy-get-address-eth": "legacy-get-address-btc",
  "legacy-get-address-btc": "dmk-get-address",
  "dmk-get-address": "uninstall-eth",
  "uninstall-eth": "uninstall-btc",
  "uninstall-btc": "completed",
};

// ---------------------------------------------------------------------------
// Phase builder
// ---------------------------------------------------------------------------

function buildPhase(
  phase: DemoPhase["phase"],
  defs: DemoIntentDefinitions,
  tickCount: number,
  currentRequiredContext: RequiredDeviceContext,
): DemoPhase {
  switch (phase) {
    case "idle":
      return { phase: "idle" };

    case "timer":
      return {
        phase: "timer",
        intent: createIntent(defs.timer, { tickCount }),
        extraProps: {},
        requiredContext: BOLOS_CONTEXT,
      };

    case "legacy-get-address-eth":
      return {
        phase: "legacy-get-address-eth",
        intent: createIntent(defs.getAddressLegacyWithDevice, {
          currencyId: "ethereum",
          path: "44'/60'/0'/0/0",
          derivationMode: "",
        }),
        extraProps: {},
        requiredContext: ETHEREUM_CONTEXT,
      };

    case "legacy-get-address-btc":
      return {
        phase: "legacy-get-address-btc",
        intent: createIntent(defs.getAddressLegacyWithDevice, {
          currencyId: "bitcoin",
          path: "84'/0'/0'/0/0",
          derivationMode: "native_segwit",
        }),
        extraProps: {},
        requiredContext: BITCOIN_CONTEXT,
      };

    case "dmk-get-address":
      return {
        phase: "dmk-get-address",
        intent: createIntent(defs.getEthAddressDMKSigner, { derivationPath: "44'/60'/0'/0/0" }),
        extraProps: {},
        requiredContext: ETHEREUM_CONTEXT,
      };

    case "uninstall-eth":
      return {
        phase: "uninstall-eth",
        intent: createIntent(defs.uninstallApp, { appName: "Ethereum" }),
        extraProps: { appName: "Ethereum" },
        requiredContext: currentRequiredContext,
      };

    case "uninstall-btc":
      return {
        phase: "uninstall-btc",
        intent: createIntent(defs.uninstallApp, { appName: "Bitcoin" }),
        extraProps: { appName: "Bitcoin" },
        requiredContext: currentRequiredContext,
      };

    case "completed":
      return { phase: "completed" };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type DemoOrchestrationResult = {
  demoPhase: DemoPhase;
  executorState: ExecutorState | null;
  latestJobState: AnyDemoJobState | null;
  jobCompleted: boolean;
  jobError: unknown;
  toggleEnabled: () => void;
} & (
  | {
      enabled: true;
      executorProps: DeviceIntentExecutorProps<AnyDemoJobState, AnyDemoInput, AnyDemoExtraProps>;
    }
  | {
      enabled: false;
      executorProps: undefined;
    }
);

/**
 * Drives the demo playground through a linear sequence of intent phases:
 * timer -> legacy getAddress (ETH, BTC) -> DMK signer getAddress -> uninstall (ETH, BTC).
 *
 * Each phase creates an {@link Intent} instance from the injected definitions,
 * feeds it to the `DeviceIntentExecutor` via props, and auto-advances
 * to the next phase when the job completes.
 */
export function useDemoIntentOrchestration({
  tickCount,
  intentDefs,
}: {
  tickCount: number;
  intentDefs: DemoIntentDefinitions;
}): DemoOrchestrationResult {
  const [enabled, setEnabled] = useState(false);
  const [demoPhase, setDemoPhase] = useState<DemoPhase>({ phase: "idle" });
  const [executorState, setExecutorState] = useState<ExecutorState | null>(null);
  const [latestJobState, setLatestJobState] = useState<AnyDemoJobState | null>(null);
  const [jobCompleted, setJobCompleted] = useState(false);
  const [jobError, setJobError] = useState<unknown>(null);

  const advance = useCallback(() => {
    setDemoPhase(prev => {
      if (prev.phase === "idle" || prev.phase === "completed") return prev;
      const next = NEXT_PHASE[prev.phase];
      setLatestJobState(null);
      setJobCompleted(false);
      setJobError(null);
      if (next === "completed") {
        setEnabled(false);
      }
      const currentCtx = "requiredContext" in prev ? prev.requiredContext : BOLOS_CONTEXT;
      return buildPhase(next, intentDefs, tickCount, currentCtx);
    });
  }, [intentDefs, tickCount]);

  const handleJobStateChanged = useCallback((state: AnyDemoJobState) => {
    setLatestJobState(state);
  }, []);

  const handleJobComplete = useCallback(() => {
    setJobCompleted(true);
    advance();
  }, [advance]);

  const handleExecutorStateChanged = useCallback((state: ExecutorState) => {
    setExecutorState(state);
  }, []);

  const handleJobError = useCallback((error: unknown) => {
    setJobError(error);
  }, []);

  useEffect(() => {
    if (enabled) {
      setDemoPhase(buildPhase("timer", intentDefs, tickCount, BOLOS_CONTEXT));
    } else {
      setDemoPhase({ phase: "idle" });
    }
    setLatestJobState(null);
    setJobCompleted(false);
    setJobError(null);
    setExecutorState(null);
  }, [enabled, intentDefs, tickCount]);

  const isActive = demoPhase.phase !== "idle" && demoPhase.phase !== "completed";

  const executorProps = useMemo(():
    | DeviceIntentExecutorProps<AnyDemoJobState, AnyDemoInput, AnyDemoExtraProps>
    | undefined => {
    if (!enabled || !isActive) {
      return undefined;
    }
    return {
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      requiredDeviceContext: demoPhase.requiredContext,
      intent: demoPhase.intent as AnyDemoIntent, // eslint-disable-line @typescript-eslint/consistent-type-assertions
      intentComponentExtraProps: demoPhase.extraProps as AnyDemoExtraProps, // eslint-disable-line @typescript-eslint/consistent-type-assertions
      onExecutorStateChanged: handleExecutorStateChanged,
      onIntentJobStateChanged: handleJobStateChanged,
      onIntentJobComplete: handleJobComplete,
      onIntentJobError: handleJobError,
      cancellableUI: true,
      cancelIntentRequestId: undefined,
      onUserCancel: () => {
        setEnabled(false);
        setDemoPhase({ phase: "idle" });
        setLatestJobState(null);
        setJobCompleted(false);
        setJobError(null);
        setExecutorState(null);
      },
    };
  }, [
    demoPhase,
    handleExecutorStateChanged,
    handleJobStateChanged,
    handleJobComplete,
    handleJobError,
    enabled,
    isActive,
  ]);

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  const common = {
    demoPhase,
    executorState,
    latestJobState,
    jobCompleted,
    jobError,
    toggleEnabled,
  };

  if (!executorProps) {
    return { ...common, enabled: false, executorProps: undefined };
  }
  return { ...common, enabled: true, executorProps };
}
