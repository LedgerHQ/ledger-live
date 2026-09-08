import { useCallback, useMemo, useState } from "react";
import {
  cardManagementApi,
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
import {
  resetCardOnboardingCompleted,
  selectHasCompletedCardOnboarding,
} from "@features/flow-pay-card-widget/state";
import { setMockOnboardingStepDone } from "@domain/api-card-management/mock";
import type { DevToolsConfig } from "@devtools/registry";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];
type OnboardingStep = PayCardToolProps["onboarding"]["steps"][number];

type PayCardProbe = PayCardToolProps["interaction"]["probes"][number];

export type UsePayCardToolPropsOptions = {
  /** Pass `"native"` on mobile to include the `walletPay` onboarding step. */
  readonly platform?: "web" | "native";
};

const LEADING_ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "create-account", label: "Create account", done: true },
  { id: "choose-card-type", label: "Choose card type", done: false },
  { id: "top-up-card", label: "Top up card", done: false },
];

// Mobile-only, injected just before the final purchase step.
const NATIVE_ONLY_STEP: OnboardingStep = {
  id: "apple-google-pay",
  label: "Apple/Google Pay",
  done: false,
};

const PURCHASE_STEP: OnboardingStep = {
  id: "first-purchase",
  label: "First purchase",
  done: false,
};

function initialSteps(platform: "web" | "native"): readonly OnboardingStep[] {
  return platform === "native"
    ? [...LEADING_ONBOARDING_STEPS, NATIVE_ONLY_STEP, PURCHASE_STEP]
    : [...LEADING_ONBOARDING_STEPS, PURCHASE_STEP];
}

/**
 * The join needs a resolver, and this tool prices nothing. It is called for every wallet with a
 * balance and answers `null`, which the screen reports as unpriced.
 */
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
  const hasCompletedCardOnboarding = useSelector(selectHasCompletedCardOnboarding);

  const resetFeatureTour = useCallback(() => {
    dispatch(resetPayCardFeatureTourSeen());
  }, [dispatch]);

  const resetVerifyHint = useCallback(() => {
    dispatch(resetReceiveVerifyHintSeen());
  }, [dispatch]);

  const resetCardOnboarding = useCallback(() => {
    dispatch(resetCardOnboardingCompleted());
  }, [dispatch]);

  const setStepDone = useCallback(
    (id: string, done: boolean) => {
      setSteps(current => {
        if (id === "all") {
          return current.map(step => (step.done === done ? step : { ...step, done }));
        }
        return current.map(step =>
          step.id === id && step.done !== done ? { ...step, done } : step,
        );
      });
      setMockOnboardingStepDone(id, done);
      dispatch(cardManagementApi.util.invalidateTags(["CardOnboardingStatus"]));
    },
    [dispatch],
  );

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
      // A live, single-use credential. RTK holds it in mutation state while this hook is mounted,
      // so what the tool guarantees is narrower: it is never handed over as text, and `clear`
      // resets it on the way out.
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
      hasCompletedCardOnboarding,
      resetCardOnboarding,
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
      hasCompletedCardOnboarding,
      resetCardOnboarding,
    ],
  );
}
