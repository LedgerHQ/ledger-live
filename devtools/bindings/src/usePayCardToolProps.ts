import { useCallback, useMemo, useState } from "react";
import {
  useGetCardLinkedWalletsQuery,
  useGetInternalWalletsQuery,
  useLazyGetCardStatusQuery,
  useCreateCardDetailsTokenMutation,
  cardManagementApi,
} from "@domain/api-card-management";
import {
  clearPayCardTransactionsMock,
  emptyPayCardTransactionsMock,
  fillPayCardTransactionsMock,
  readPayCardTransactionsMock,
  receivePayCardTransactionMock,
  type PayCardMockTransactionAsset,
} from "@domain/api-card-management/mock/card-transactions";
import {
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
  fillPayCardWalletsMock,
  fundPayCardWalletMock,
  readPayCardReorderMockEnabled,
  readPayCardWalletsMock,
  setPayCardReorderMockEnabled,
  type PayCardMockWalletAsset,
} from "@domain/api-card-management/mock/card-wallets";
import { BAANX_ASSET_LEDGER_IDS } from "@domain/entity-card-asset-mapping";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  useCardLinkedWallets,
  type CardLinkedWalletBalance,
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
  resetPayCardLoginIntroSeen,
  selectPayCardHasSeenLoginIntro,
} from "@features/flow-pay-card-auth/state";
import {
  markCardAddedToWallet,
  resetCardAddedToWallet,
  resetCardOnboardingCompleted,
  selectHasCompletedCardOnboarding,
} from "@features/flow-pay-card-widget/state";
import { useCardOnboardingStatus } from "@features/flow-pay-card-widget/onboarding-status";
import {
  clearCardOnboardingStatusMock,
  setCardOnboardingStatusMock,
  type CardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import type { DevToolsConfig } from "@devtools/registry";
import { isRequestMockingEnabled } from "./isRequestMockingEnabled";
import { usePayCardAuthProps } from "./usePayCardAuthProps";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];

type PayCardProbe = PayCardToolProps["interaction"]["probes"][number];

export type UsePayCardToolPropsOptions = {
  readonly platform?: "web" | "native";
  readonly openPayTab?: () => void;
  readonly openSecureBrowser?: PayCardToolProps["openSecureBrowser"];
  /** Resolves each wallet's Ledger id to a currency; the catalog is the app's. */
  readonly currencies?: ReadonlyMap<string, CryptoOrTokenCurrency>;
};

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

const STEP_ANSWERS: Readonly<Partial<Record<string, keyof CardOnboardingStatusMock>>> = {
  "create-account": "accountVerified",
  "choose-card-type": "hasCard",
  "top-up-card": "walletFunded",
};

/**
 * The catalog as the tool lists it, in key order so a pair is easy to find by eye.
 *
 * A key the catalog holds no id for is dropped: the screen lists what resolves, and a row with a
 * blank currency would read as a mapping that exists and is wrong.
 */
const CURRENCY_MAPPING_ROWS = Object.entries(BAANX_ASSET_LEDGER_IDS)
  .flatMap(([key, ledgerId]) => (ledgerId === undefined ? [] : [{ key, ledgerId }]))
  .sort((a, b) => a.key.localeCompare(b.key));

type PayCardCombinedWallet = PayCardToolProps["balance"]["combinedWallets"][number];

/**
 * One joined wallet as the tool lists it.
 *
 * An unmapped asset has no Ledger currency, so its row has no `ledgerId` at all. That is the shape
 * the transform and the join answer with, and repeating it here keeps a mapped pair distinguishable
 * from an unmapped one by shape alone.
 */
function toCombinedWallet({
  id,
  address,
  currency,
  network,
  priority,
  ledgerId,
  balance,
  ledgerCurrency,
}: CardLinkedWalletBalance): PayCardCombinedWallet {
  const row = {
    id,
    address,
    currency,
    network,
    priority,
    balance,
    ledgerCurrencyId: ledgerCurrency?.id ?? null,
  };

  return ledgerId === undefined ? row : { ...row, ledgerId };
}

const WALLET_STEP_ID = "apple-google-pay";

function describeError(error: unknown): string {
  if (error === undefined || error === null) return "";
  return typeof error === "string" ? error : JSON.stringify(error, null, 2);
}

export function usePayCardToolProps(options: UsePayCardToolPropsOptions = {}): PayCardToolProps {
  const platform = options.platform ?? "web";
  const dispatch = useDispatch();
  const payTabKey = platform === "native" ? "lwmPayTab" : "lwdPayTab";
  const payTab = useFeature(payTabKey);
  const ptxCard = useFeature("ptxCard");

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
      dispatch(
        setOverride({
          key: payTabKey,
          value: { enabled: payTabEnabled, params },
        }),
      );
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

  const hasSeenLoginIntro = useSelector(selectPayCardHasSeenLoginIntro);

  const resetLoginIntro = useCallback(() => {
    dispatch(resetPayCardLoginIntroSeen());
  }, [dispatch]);

  const resetCardOnboarding = useCallback(() => {
    dispatch(resetCardOnboardingCompleted());
  }, [dispatch]);

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

  const auth = usePayCardAuthProps({ openPayTab: options.openPayTab });
  // Read when the screen asks for it, not when the tool mounts: these are Card endpoints, and a
  // developer who opened DevTools for something else should not have a session sent to them. Both
  // hosts mock them, so the screen works on either once it has asked.
  const [onboardingRequested, setOnboardingRequested] = useState(false);
  const onboardingStatus = useCardOnboardingStatus({
    skip: !onboardingRequested,
  });
  const { data: derivedOnboarding, refresh: refreshStatus } = onboardingStatus;

  const refreshCardOnboarding = useCallback(() => {
    // The first call starts the reads by lifting the skip; `refresh` only re-asks once they exist.
    setOnboardingRequested(true);
    refreshStatus();
  }, [refreshStatus]);

  const setDerivedStepDone = useCallback(
    (id: string, done: boolean) => {
      if (id === WALLET_STEP_ID) {
        dispatch(done ? markCardAddedToWallet() : resetCardAddedToWallet());
        return;
      }

      const answer = STEP_ANSWERS[id];
      if (answer === undefined) return;

      setCardOnboardingStatusMock(answer, done);
      refreshCardOnboarding();
    },
    [dispatch, refreshCardOnboarding],
  );

  const clearCardOnboardingMocks = useCallback(() => {
    clearCardOnboardingStatusMock();
    refreshCardOnboarding();
  }, [refreshCardOnboarding]);

  const cardOnboarding = useMemo(() => {
    const isMockingEnabled = isRequestMockingEnabled();

    return {
      steps: derivedOnboarding.steps.map(step => ({
        id: step.id,
        isDone: step.isDone,
        canToggle: step.id === WALLET_STEP_ID || (isMockingEnabled && step.id in STEP_ANSWERS),
      })),
      completedCount: derivedOnboarding.completedCount,
      isFetching: onboardingStatus.isLoading,
      error: onboardingStatus.isError ? "the account could not be read" : undefined,
      raw: JSON.stringify(derivedOnboarding, null, 2),
      refresh: refreshCardOnboarding,
      setStepDone: setDerivedStepDone,
      clearMocks: clearCardOnboardingMocks,
      isMockingEnabled,
    };
  }, [
    derivedOnboarding,
    onboardingStatus.isLoading,
    onboardingStatus.isError,
    refreshCardOnboarding,
    setDerivedStepDone,
    clearCardOnboardingMocks,
  ]);

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

  const [walletsRequested, setWalletsRequested] = useState(false);
  const [, setMockVersion] = useState(0);
  const skipWallets = !walletsRequested;

  const linkedWallets = useCardLinkedWallets({
    currencies: options.currencies ?? NO_CURRENCIES,
    skip: skipWallets,
  });

  const loadWallets = useCallback(() => setWalletsRequested(true), []);

  const { refetch: refetchWallets } = linkedWallets;
  const refreshWallets = useCallback(() => {
    setWalletsRequested(true);
    refetchWallets();
  }, [refetchWallets]);

  const updateWallets = useCallback(
    (update: () => void) => {
      update();
      setWalletsRequested(true);
      setMockVersion(version => version + 1);
      dispatch(cardManagementApi.util.invalidateTags(["InternalWallets", "CardLinkedWallets"]));
    },
    [dispatch],
  );
  const walletMock = {
    available: isRequestMockingEnabled(),
    isOverridden: readPayCardWalletsMock() !== undefined,
    fill: () => updateWallets(fillPayCardWalletsMock),
    empty: () => updateWallets(emptyPayCardWalletsMock),
    fund: (asset: PayCardMockWalletAsset) => updateWallets(() => fundPayCardWalletMock(asset)),
    clear: () => updateWallets(clearPayCardWalletsMock),
  };

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
        .map(({ endpoint, error }) => ({
          endpoint,
          detail: describeError(error),
        })),
    [linkedError, internalError],
  );

  const balance = useMemo(
    () => ({
      baanxWallets: internal ?? [],
      linkedWallets: linked ?? [],
      combinedWallets: linkedWallets.wallets.map(toCombinedWallet),
      isFetching: linkedWallets.isFetching,
      errors,
      mock: walletMock,
      load: loadWallets,
      refresh: refreshWallets,
    }),
    [internal, linked, linkedWallets, errors, walletMock, loadWallets, refreshWallets],
  );

  const updateTransactions = useCallback(
    (update: () => void) => {
      update();
      setMockVersion(version => version + 1);
      dispatch(cardManagementApi.util.invalidateTags(["CardTransactions"]));
    },
    [dispatch],
  );
  const setReorderEnabled = useCallback(
    (enabled: boolean) => {
      setPayCardReorderMockEnabled(enabled);
      setMockVersion(version => version + 1);
      dispatch(cardManagementApi.util.invalidateTags(["CardLinkedWallets"]));
    },
    [dispatch],
  );
  const reorder = {
    available: isRequestMockingEnabled(),
    enabled: readPayCardReorderMockEnabled(),
    setEnabled: setReorderEnabled,
  };

  const mockedTransactions = readPayCardTransactionsMock();
  const transactions = {
    available: isRequestMockingEnabled(),
    isOverridden: mockedTransactions !== undefined,
    count: mockedTransactions?.length ?? 0,
    fill: () => updateTransactions(fillPayCardTransactionsMock),
    empty: () => updateTransactions(emptyPayCardTransactionsMock),
    receive: (asset: PayCardMockTransactionAsset) =>
      updateTransactions(() => receivePayCardTransactionMock(asset)),
    clear: () => updateTransactions(clearPayCardTransactionsMock),
  };

  return useMemo(
    () => ({
      flags,
      cardOnboarding,
      interaction,
      balance,
      transactions,
      reorder,
      currencyMapping: CURRENCY_MAPPING_ROWS,
      hasSeenFeatureTour,
      resetPayCardFeatureTourSeen: resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetReceiveVerifyHintSeen: resetVerifyHint,
      hasSeenLoginIntro,
      resetPayCardLoginIntroSeen: resetLoginIntro,
      hasCompletedCardOnboarding,
      resetCardOnboarding,
      auth,
      openSecureBrowser: options.openSecureBrowser,
    }),
    [
      flags,
      cardOnboarding,
      interaction,
      balance,
      transactions,
      reorder,
      hasSeenFeatureTour,
      resetFeatureTour,
      hasSeenReceiveVerifyHint,
      resetVerifyHint,
      hasSeenLoginIntro,
      resetLoginIntro,
      hasCompletedCardOnboarding,
      resetCardOnboarding,
      auth,
      options.openSecureBrowser,
    ],
  );
}
