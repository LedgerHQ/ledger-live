import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import {
  payCardFeatureTourSlice,
  markPayCardFeatureTourSeen,
} from "@features/flow-pay-feature-tour/state";
import {
  payRequestVerifyHintSlice,
  markReceiveVerifyHintSeen,
} from "@features/flow-pay-request/state";
import { cardApi } from "@shared/api-services";
import {
  payCardLoginIntroSlice,
  markPayCardLoginIntroSeen,
} from "@features/flow-pay-card-auth/state";
import { payCardOnboardingWidgetSlice } from "@features/flow-pay-card-widget/state";
import {
  clearCardOnboardingStatusMock,
  readCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { cardManagementApi } from "@domain/api-card-management";
import { usePayCardToolProps } from "./usePayCardToolProps";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";

const LINKED_WALLETS = [
  { id: "w-usdc", address: "0xusdc", currency: "usdc", network: "ethereum", priority: 0 },
  { id: "w-bxx", address: "0xbxx", currency: "bxx", network: "ethereum", priority: 1 },
];

const INTERNAL_WALLETS = [
  { id: "w-usdc", balance: "125.40", currency: "usdc", address: "0xusdc", addressMemo: null },
  { id: "w-bxx", balance: "5.00", currency: "bxx", address: "0xbxx", addressMemo: null },
];

/** Seeds both wallet reads: one asset the catalog covers, one it does not. */
async function seedWallets(store: ReturnType<typeof buildStore>) {
  await store.dispatch(
    cardManagementApi.util.upsertQueryData("getCardLinkedWallets", undefined, LINKED_WALLETS),
  );
  await store.dispatch(
    cardManagementApi.util.upsertQueryData("getInternalWallets", undefined, INTERNAL_WALLETS),
  );
  store.dispatch(
    cardManagementApi.util.updateQueryData("getCardLinkedWallets", undefined, draft => {
      draft[0]!.ledgerId = "ethereum/erc20/usd__coin";
    }),
  );
}

function buildStore() {
  return configureStore({
    reducer: {
      featureFlags: featureFlagsReducer,
      payCardFeatureTour: payCardFeatureTourSlice.reducer,
      payRequestVerifyHint: payRequestVerifyHintSlice.reducer,
      payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer,
      // The tool reads the Card endpoints, so its api has to be part of the store under test.
      [cardApi.reducerPath]: cardApi.reducer,
      payCardLoginIntro: payCardLoginIntroSlice.reducer,
    },
    middleware: gdm =>
      gdm()
        .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }))
        .concat(cardApi.middleware),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

const CURRENCIES = new Map([
  [
    "ethereum/erc20/usd__coin",
    CryptoOrTokenCurrencySchema.parse({
      type: "TokenCurrency",
      id: "ethereum/erc20/usd__coin",
      parentCurrencyId: "ethereum",
      contractAddress: "0x0000000000000000000000000000000000000000",
      tokenType: "erc20",
      name: "USD Coin",
      ticker: "USDC",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    }),
  ],
]);

describe("usePayCardToolProps", () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(() => {
    store = buildStore();
  });

  it("exposes default flag values", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.flags.payTabEnabled).toBe(false);
    expect(result.current.flags.ptxCardEnabled).toBe(false);
  });

  it("setPayTabEnabled overrides lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setPayTabEnabled overrides lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setCardParam updates params.card on lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setCardParam updates params.card on lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setPtxCardEnabled overrides ptxCard", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPtxCardEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.ptxCard?.enabled).toBe(true);
    expect(result.current.flags.ptxCardEnabled).toBe(true);
  });

  it("reports no balance until the screen asks for one", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.balance).toMatchObject({
      baanxWallets: [],
      linkedWallets: [],
      combinedWallets: [],
      isFetching: false,
      errors: [],
    });
  });

  it("starts reading the wallets when the screen opens", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => result.current.balance.load());

    expect(result.current.balance.isFetching).toBe(true);
  });

  it("hands the tool a row per joined wallet, with the currency the host resolved", async () => {
    const store = buildStore();
    await act(() => seedWallets(store));
    const { result } = renderHook(() => usePayCardToolProps({ currencies: CURRENCIES }), {
      wrapper: withStore(store),
    });

    act(() => result.current.balance.load());
    await waitFor(() => expect(result.current.balance.combinedWallets).toHaveLength(2));

    expect(result.current.balance.combinedWallets[0]).toEqual({
      id: "w-usdc",
      address: "0xusdc",
      currency: "usdc",
      network: "ethereum",
      priority: 0,
      ledgerId: "ethereum/erc20/usd__coin",
      balance: "125.40",
      ledgerCurrencyId: "ethereum/erc20/usd__coin",
    });
  });

  it("leaves the Ledger currency off a row the catalog does not cover", async () => {
    const store = buildStore();
    await act(() => seedWallets(store));
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => result.current.balance.load());
    await waitFor(() => expect(result.current.balance.combinedWallets).toHaveLength(2));

    const [, unmapped] = result.current.balance.combinedWallets;
    // Absent, not `undefined`.
    expect(unmapped && "ledgerId" in unmapped).toBe(false);
    expect(unmapped?.ledgerCurrencyId).toBeNull();
  });

  it("reads the wallets on a refresh, even as the first thing the screen does", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    // Refresh both requests them and refetches, so it stands on its own: pressing it before the
    // first read has landed must not leave the screen with nothing.
    act(() => result.current.balance.refresh());

    expect(result.current.balance.isFetching).toBe(true);
  });

  it("hands the tool the whole asset catalog, in key order", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    const { currencyMapping } = result.current;
    const keys = currencyMapping.map(({ key }) => key);

    expect(keys).toEqual([...keys].sort());
    expect(currencyMapping).toContainEqual({
      key: "usdc.ethereum",
      ledgerId: "ethereum/erc20/usd__coin",
    });
    // Every row names a currency: an entry with no id would read as a mapped asset that is not.
    expect(currencyMapping.every(({ ledgerId }) => ledgerId.length > 0)).toBe(true);
  });

  it("exposes hasSeenFeatureTour from the payCard slice", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenFeatureTour).toBe(true);
  });

  it("exposes hasSeenLoginIntro from the payCard slice", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenLoginIntro).toBe(true);
  });

  it("resetPayCardFeatureTourSeen clears the seen flag", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardFeatureTourSeen();
    });

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(false);
    expect(result.current.hasSeenFeatureTour).toBe(false);
  });

  it("exposes hasSeenReceiveVerifyHint from the request verify hint slice", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("resetReceiveVerifyHintSeen clears the seen flag", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetReceiveVerifyHintSeen();
    });

    expect(store.getState().payRequestVerifyHint.hasSeenReceiveVerifyHint).toBe(false);
    expect(result.current.hasSeenReceiveVerifyHint).toBe(false);
  });

  it("resetPayCardLoginIntroSeen clears the seen flag", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(result.current.hasSeenLoginIntro).toBe(false);
  });

  it("keeps the two reset actions apart", () => {
    store.dispatch(markPayCardFeatureTourSeen());
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
  });

  describe("driving the onboarding steps", () => {
    beforeEach(() => {
      delete process.env.MSW_ENABLED;
    });

    afterEach(() => {
      clearCardOnboardingStatusMock();
      delete process.env.MSW_ENABLED;
    });

    it("reads the status on either host, once the screen asks for it", async () => {
      const store = buildStore();
      // No platform: the desktop tool, which is where the read used to be skipped outright.
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      // Nothing is asked for until the screen opens, so DevTools does not send a session anywhere.
      expect(result.current.cardOnboarding.isFetching).toBe(false);

      act(() => result.current.cardOnboarding.refresh());

      await waitFor(() => expect(result.current.cardOnboarding.isFetching).toBe(true));
    });

    it("sets the answer behind a step rather than the step itself", () => {
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("top-up-card", true);
        result.current.cardOnboarding.setStepDone("create-account", false);
      });

      expect(readCardOnboardingStatusMock()).toEqual({
        walletFunded: true,
        accountVerified: false,
      });
    });

    it("keeps the phone wallet step on the device, because no endpoint answers it", () => {
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("apple-google-pay", true);
      });

      expect(store.getState().payCardOnboardingWidget.hasAddedCardToWallet).toBe(true);
      expect(readCardOnboardingStatusMock()).toEqual({});
    });

    it("writes the phone wallet answer to the mock while mocking is on, not to the device", () => {
      process.env.MSW_ENABLED = "true";
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("apple-google-pay", true);
      });

      expect(readCardOnboardingStatusMock()).toEqual({ cardAddedToDigitalWallet: true });
      expect(store.getState().payCardOnboardingWidget.hasAddedCardToWallet).toBe(false);
    });

    it("hands the phone wallet step back to the provider when the answer is cleared", () => {
      process.env.MSW_ENABLED = "true";
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("apple-google-pay", false);
      });

      expect(readCardOnboardingStatusMock()).toEqual({ cardAddedToDigitalWallet: false });
    });

    it("ignores a step nothing answers, so the purchase step cannot be forced", () => {
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("first-purchase", true);
      });

      expect(readCardOnboardingStatusMock()).toEqual({});
    });

    it("hands every endpoint back to the provider", () => {
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      act(() => {
        result.current.cardOnboarding.setStepDone("create-account", true);
        result.current.cardOnboarding.setStepDone("choose-card-type", true);
      });
      act(() => {
        result.current.cardOnboarding.clearMocks();
      });

      expect(readCardOnboardingStatusMock()).toEqual({});
    });

    it("offers no toggle at all while the host intercepts nothing", () => {
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      expect(result.current.cardOnboarding.isMockingEnabled).toBe(false);
      // Every step this project lists is answered by a request: the phone wallet step, which is
      // answered on the device instead, is mobile-only and this project resolves the web hook.
      expect(result.current.cardOnboarding.steps.every(({ canToggle }) => !canToggle)).toBe(true);
    });

    it("offers one per endpoint-answered step once the host intercepts requests", () => {
      process.env.MSW_ENABLED = "true";
      const store = buildStore();
      const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

      expect(result.current.cardOnboarding.isMockingEnabled).toBe(true);
      const togglable = result.current.cardOnboarding.steps
        .filter(({ canToggle }) => canToggle)
        .map(({ id }) => id);
      expect(togglable).toContain("create-account");
      expect(togglable).toContain("choose-card-type");
      expect(togglable).toContain("top-up-card");
      // Nothing answers the purchase step yet, so it stays read-only.
      expect(togglable).not.toContain("first-purchase");
    });
  });
});
