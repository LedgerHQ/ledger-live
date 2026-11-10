import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import {
  markPredictionsIntroSeen,
  resetPredictionsIntroSeen,
  selectHasSeenIntro,
} from "@domain/entity-predictions";
import type { usePredictionsSetupHooks } from "@features/flow-predictions/state";
import type { PredictionsSetupFailureReason } from "@features/platform-predictions";

type PredictionsToolProps = Extract<DevToolsConfig[number], { id: "predictions" }>["config"];
type PredictionsOnboardingState = PredictionsToolProps["onboardingStates"][number];
type PredictionsReset = Parameters<PredictionsToolProps["reset"]>[1];
type PredictionsSetupPreview = NonNullable<Parameters<PredictionsToolProps["previewSetup"]>[0]>;

/** Passed in rather than imported, so loading the bindings doesn't load the Predictions UI. */
export interface PredictionsSetup {
  hooks: ReturnType<typeof usePredictionsSetupHooks>;
  failureReasons: readonly PredictionsSetupFailureReason[];
}

/** A live app's Wallet API storage, as `storage.get` and `storage.set` reach it. */
export interface LiveAppStore {
  get: (key: string, storeId: string) => unknown;
  set: (key: string, value: string, storeId: string) => unknown;
}

// The live app's storage is scoped by its manifest id, which differs per environment.
const ENVIRONMENTS = [
  { manifestId: "predictions-live-app", label: "Production" },
  { manifestId: "predictions-live-app-stg", label: "Staging" },
] as const;
const ONBOARDING_STATE_KEY = "onboarding-state";

type StoredState = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The live app stores its onboarding as JSON: `{ version, acceptedVersions, addresses:
 * { [address]: { isBound } }, activeAddress? }`. It reads an empty or unreadable value as a user
 * who never onboarded.
 */
function parseStored(stored: unknown): StoredState | undefined {
  if (typeof stored !== "string" || stored === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(stored);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function toAcceptedVersions(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function toOnboardingState(
  { manifestId, label }: (typeof ENVIRONMENTS)[number],
  stored: unknown,
): PredictionsOnboardingState {
  const state = parseStored(stored);
  const raw = typeof stored === "string" && stored !== "" ? stored : undefined;
  if (state === undefined) {
    return { manifestId, label, isStored: false, acceptedVersions: {}, addresses: [], raw };
  }
  const addresses = isRecord(state.addresses) ? state.addresses : {};
  return {
    manifestId,
    label,
    isStored: true,
    acceptedVersions: toAcceptedVersions(state.acceptedVersions),
    addresses: Object.entries(addresses).map(([address, link]) => ({
      address,
      isBound: isRecord(link) && link.isBound === true,
      isActive: address === state.activeAddress,
    })),
    raw,
  };
}

function forget(state: StoredState, what: Exclude<PredictionsReset, "everything">): StoredState {
  switch (what) {
    case "binding": {
      const { activeAddress } = state;
      if (typeof activeAddress !== "string" || !isRecord(state.addresses)) return state;
      return {
        ...state,
        addresses: { ...state.addresses, [activeAddress]: { isBound: false } },
      };
    }
    case "accounts": {
      const { activeAddress: _activeAddress, ...rest } = state;
      return { ...rest, addresses: {} };
    }
    case "documents":
      return { ...state, acceptedVersions: {} };
  }
}

/** `liveAppStore` and `setup` must be stable, e.g. defined at module level or memoized. */
export function usePredictionsToolProps(
  liveAppStore: LiveAppStore,
  { hooks: setupHooks, failureReasons: setupFailureReasons }: PredictionsSetup,
): PredictionsToolProps {
  const dispatch = useDispatch();
  const hasSeenIntro = useSelector(selectHasSeenIntro);
  const [onboardingStates, setOnboardingStates] = useState<PredictionsOnboardingState[]>([]);

  const refresh = useCallback(async () => {
    const states = await Promise.all(
      ENVIRONMENTS.map(async environment =>
        toOnboardingState(
          environment,
          await liveAppStore.get(ONBOARDING_STATE_KEY, environment.manifestId),
        ),
      ),
    );
    setOnboardingStates(states);
  }, [liveAppStore]);

  const setIntroSeen = useCallback(
    (isSeen: boolean) => {
      dispatch(isSeen ? markPredictionsIntroSeen() : resetPredictionsIntroSeen());
    },
    [dispatch],
  );

  const resetEnvironment = useCallback(
    async (manifestId: string, what: PredictionsReset) => {
      if (what === "everything") {
        await liveAppStore.set(ONBOARDING_STATE_KEY, "", manifestId);
        return;
      }
      const state = parseStored(await liveAppStore.get(ONBOARDING_STATE_KEY, manifestId));
      if (state === undefined) return;
      await liveAppStore.set(ONBOARDING_STATE_KEY, JSON.stringify(forget(state, what)), manifestId);
    },
    [liveAppStore],
  );

  const reset = useCallback(
    async (manifestId: string, what: PredictionsReset) => {
      await resetEnvironment(manifestId, what);
      await refresh();
    },
    [refresh, resetEnvironment],
  );

  const replayWholeOnboarding = useCallback(async () => {
    setIntroSeen(false);
    await Promise.all(
      ENVIRONMENTS.map(({ manifestId }) => resetEnvironment(manifestId, "everything")),
    );
    await refresh();
  }, [refresh, resetEnvironment, setIntroSeen]);

  const previewSetup = useCallback(
    (preview?: PredictionsSetupPreview) => {
      setupHooks.startSetup();
      if (preview === undefined) return;
      if (preview.outcome !== "failed") {
        void setupHooks["binding.reportSetup"](preview);
        return;
      }
      const reason = setupFailureReasons.find(known => known === preview.reason) ?? "unknown";
      void setupHooks["binding.reportSetup"]({ outcome: "failed", reason });
    },
    [setupHooks, setupFailureReasons],
  );

  return useMemo(
    () => ({
      hasSeenIntro,
      setIntroSeen,
      onboardingStates,
      refresh,
      reset,
      replayWholeOnboarding,
      setupFailureReasons,
      previewSetup,
    }),
    [
      hasSeenIntro,
      setIntroSeen,
      onboardingStates,
      refresh,
      reset,
      replayWholeOnboarding,
      setupFailureReasons,
      previewSetup,
    ],
  );
}
