import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOverride } from "@shared/feature-flags";
import { changes, getEnv, setEnvUnsafe, type EnvName } from "@shared/env";
import { useFeature } from "@features/platform-feature-flags";
import {
  resetPayCardFeatureTourSeen,
  selectPayCardHasSeenFeatureTour,
} from "@features/flow-pay-feature-tour/state";
import {
  resetReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-pay-request/state";
import type { DevToolsConfig } from "@devtools/registry";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];
type OnboardingStep = PayCardToolProps["onboarding"]["steps"][number];
type PayCardEnvVar = PayCardToolProps["env"]["vars"][number];

export type UsePayCardToolPropsOptions = {
  /** Pass `"native"` on mobile to include the `walletPay` onboarding step. */
  readonly platform?: "web" | "native";
};

const LEADING_ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "kyc", label: "Kyc", done: false },
  { id: "claim", label: "Claim card", done: false },
  { id: "topup", label: "Top up", done: false },
];

// Mobile-only, injected just before the final purchase step.
const NATIVE_ONLY_STEP: OnboardingStep = {
  id: "walletPay",
  label: "Apple/Google Pay",
  done: false,
};

const PURCHASE_STEP: OnboardingStep = { id: "purchase", label: "First Purchase", done: false };

/**
 * The two Card env vars the tool shows, each with the value of the Baanx development tenant.
 *
 * A release build carries neither, so it starts on the definition defaults: the production URL and
 * an empty client key. The suggestions put the development tenant one press away.
 */
const CARD_ENV_VARS: readonly { key: EnvName; suggestedValue: string }[] = [
  { key: "CARD_API_URL", suggestedValue: "https://dev.api.baanx.com" },
  { key: "CARD_BAANX_CLIENT_KEY", suggestedValue: "dc16bbda-eb1b-487c-be60-1a90ca7c9dd6" },
];

function readCardEnvVars(): readonly PayCardEnvVar[] {
  return CARD_ENV_VARS.map(({ key, suggestedValue }) => ({
    key,
    value: String(getEnv(key)),
    suggestedValue,
  }));
}

function initialSteps(platform: "web" | "native"): readonly OnboardingStep[] {
  return platform === "native"
    ? [...LEADING_ONBOARDING_STEPS, NATIVE_ONLY_STEP, PURCHASE_STEP]
    : [...LEADING_ONBOARDING_STEPS, PURCHASE_STEP];
}

/**
 * Builds the Card / Pay tool's props from the host's feature-flag overrides and
 * a local onboarding-step debug state. Apps consume this instead of re-implementing
 * the wiring in each host.
 */
export function usePayCardToolProps(options: UsePayCardToolPropsOptions = {}): PayCardToolProps {
  const platform = options.platform ?? "web";
  const dispatch = useDispatch();
  const payTabKey = platform === "native" ? "lwmPayTab" : "lwdPayTab";
  const payTab = useFeature(payTabKey);
  const ptxCard = useFeature("ptxCard");

  const [steps, setSteps] = useState<readonly OnboardingStep[]>(() => initialSteps(platform));

  const payTabEnabled = !!payTab?.enabled;
  const cardParam = !!payTab?.params?.card;
  const ptxCardEnabled = !!ptxCard?.enabled;

  const setPayTabEnabled = useCallback(
    (enabled: boolean) => {
      const params = { card: cardParam };
      dispatch(setOverride({ key: payTabKey, value: { enabled, params } }));
    },
    [cardParam, dispatch, payTabKey],
  );

  const setCardParam = useCallback(
    (card: boolean) => {
      const params = { card };
      dispatch(setOverride({ key: payTabKey, value: { enabled: payTabEnabled, params } }));
    },
    [dispatch, payTabEnabled, payTabKey],
  );

  const setPtxCardEnabled = useCallback(
    (enabled: boolean) => {
      dispatch(setOverride({ key: "ptxCard", value: { enabled } }));
    },
    [dispatch],
  );

  const hasSeenFeatureTour = useSelector(selectPayCardHasSeenFeatureTour);
  const hasSeenReceiveVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);

  const resetFeatureTour = useCallback(() => {
    dispatch(resetPayCardFeatureTourSeen());
  }, [dispatch]);

  const resetVerifyHint = useCallback(() => {
    dispatch(resetReceiveVerifyHintSeen());
  }, [dispatch]);

  const setStepDone = useCallback((id: string, done: boolean) => {
    setSteps(current => {
      if (id === "all") {
        return current.map(step => (step.done === done ? step : { ...step, done }));
      }
      return current.map(step => (step.id === id && step.done !== done ? { ...step, done } : step));
    });
  }, []);

  const flags = useMemo(
    () => ({
      payTabEnabled,
      cardParam,
      ptxCardEnabled,
      setPayTabEnabled,
      setCardParam,
      setPtxCardEnabled,
    }),
    [payTabEnabled, cardParam, ptxCardEnabled, setPayTabEnabled, setCardParam, setPtxCardEnabled],
  );

  const onboarding = useMemo(() => ({ steps, setStepDone }), [steps, setStepDone]);

  const [envVars, setEnvVars] = useState<readonly PayCardEnvVar[]>(readCardEnvVars);

  useEffect(() => {
    // Read again on mount, because a change can land between the first render and this subscription.
    setEnvVars(readCardEnvVars());
    const sub = changes.subscribe(({ name }) => {
      if (CARD_ENV_VARS.some(candidate => candidate.key === name)) setEnvVars(readCardEnvVars());
    });
    return () => sub.unsubscribe();
  }, []);

  const setEnvVar = useCallback((key: string, value: string) => {
    setEnvUnsafe(key, value);
  }, []);

  const env = useMemo(() => ({ vars: envVars, setVar: setEnvVar }), [envVars, setEnvVar]);

  return useMemo(
    () => ({
      flags,
      onboarding,
      hasSeenFeatureTour,
      resetPayCardFeatureTourSeen: resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetReceiveVerifyHintSeen: resetVerifyHint,
      env,
    }),
    [
      flags,
      onboarding,
      hasSeenFeatureTour,
      resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetVerifyHint,
      env,
    ],
  );
}
