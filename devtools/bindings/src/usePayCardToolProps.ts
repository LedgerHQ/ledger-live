import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useGetCardLinkedWalletsQuery,
  useGetInternalWalletsQuery,
  useLazyGetCardStatusQuery,
  useCreateCardDetailsTokenMutation,
} from "@domain/api-card-management";
import {
  useCardLinkedWallets,
  type ResolveWalletCounterValue,
} from "@features/flow-pay-card-wallets";
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
import type { PayCardDetailsCss } from "@domain/api-card-management";
import type { DevToolsConfig } from "@devtools/registry";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];
type OnboardingStep = PayCardToolProps["onboarding"]["steps"][number];
type PayCardEnvVar = PayCardToolProps["env"]["vars"][number];

type PayCardProbe = PayCardToolProps["interaction"]["probes"][number];

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

/** Never called: the wallet queries are skipped whenever the host omits its own resolver. */
/** The tool reports what the endpoints answer, not what it is worth. The join needs one anyway. */
const NO_COUNTER_VALUE: ResolveWalletCounterValue = () => null;

/** Reads what an endpoint answered, whatever shape the failure arrives in. */
function describeError(error: unknown): string {
  if (error === undefined || error === null) return "";
  return typeof error === "string" ? error : JSON.stringify(error, null, 2);
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

  const [runCardStatus, cardStatus] = useLazyGetCardStatusQuery();

  const cardStatusProbe = useMemo<PayCardProbe>(
    () => ({
      id: "card-status",
      label: "Card Status",
      isFetching: cardStatus.isFetching,
      result: cardStatus.data === undefined ? undefined : JSON.stringify(cardStatus.data, null, 2),
      error: cardStatus.error === undefined ? undefined : describeError(cardStatus.error),
      run: () => {
        runCardStatus();
      },
    }),
    [cardStatus.isFetching, cardStatus.data, cardStatus.error, runCardStatus],
  );

  const [requestCardDetails, cardDetails] = useCreateCardDetailsTokenMutation();

  const { reset: resetCardDetails } = cardDetails;
  const details = useMemo(
    () => ({
      // The URL itself never leaves this object: it is a live, single-use credential.
      imageUrl: cardDetails.data?.imageUrl,
      isFetching: cardDetails.isLoading,
      error: cardDetails.error === undefined ? undefined : describeError(cardDetails.error),
      request: (customCss?: PayCardDetailsCss) => {
        requestCardDetails(customCss);
      },
      clear: resetCardDetails,
    }),
    [
      cardDetails.data,
      cardDetails.isLoading,
      cardDetails.error,
      requestCardDetails,
      resetCardDetails,
    ],
  );

  const interaction = useMemo(
    () => ({ probes: [cardStatusProbe], details }),
    [cardStatusProbe, details],
  );

  // The wallets are read when the balance screen opens, not when the tool mounts.
  const [walletsRequested, setWalletsRequested] = useState(false);
  const skipWallets = !walletsRequested;

  const linkedWallets = useCardLinkedWallets({
    resolveCounterValue: NO_COUNTER_VALUE,
    skip: skipWallets,
  });

  const loadWallets = useCallback(() => setWalletsRequested(true), []);

  const { refetch: refetchWallets } = linkedWallets;
  const refreshWallets = useCallback(() => {
    setWalletsRequested(true);
    refetchWallets();
  }, [refetchWallets]);

  // `useCardLinkedWallets` hands back only the join, and reports no more than that something
  // failed. Reading the same cache entries again costs no request and gives the tool both
  // responses as they arrived, which is what the screen is for.
  const { data: linked, error: linkedError } = useGetCardLinkedWalletsQuery(undefined, {
    skip: skipWallets,
  });
  const { data: internal, error: internalError } = useGetInternalWalletsQuery(undefined, {
    skip: skipWallets,
  });

  const errors = useMemo(
    () =>
      [
        { endpoint: "GET /v1/wallet/internal/card_linked", error: linkedError },
        { endpoint: "GET /v1/wallet/internal", error: internalError },
      ]
        .filter(({ error }) => error !== undefined)
        .map(({ endpoint, error }) => ({ endpoint, detail: describeError(error) })),
    [linkedError, internalError],
  );

  const balance = useMemo(
    () => ({
      baanxWallets: internal ?? [],
      linkedWallets: linked ?? [],
      // Without the counter value, which this tool does not price.
      combinedWallets: linkedWallets.wallets.map(
        ({ id, address, currency, network, priority, balance: walletBalance }) => ({
          id,
          address,
          currency,
          network,
          priority,
          balance: walletBalance,
        }),
      ),
      isFetching: linkedWallets.isFetching,
      errors,
      load: loadWallets,
      refresh: refreshWallets,
    }),
    [internal, linked, linkedWallets, errors, loadWallets, refreshWallets],
  );

  return useMemo(
    () => ({
      flags,
      onboarding,
      interaction,
      balance,
      hasSeenFeatureTour,
      resetPayCardFeatureTourSeen: resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetReceiveVerifyHintSeen: resetVerifyHint,
      env,
    }),
    [
      flags,
      onboarding,
      interaction,
      balance,
      hasSeenFeatureTour,
      resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetVerifyHint,
      env,
    ],
  );
}
