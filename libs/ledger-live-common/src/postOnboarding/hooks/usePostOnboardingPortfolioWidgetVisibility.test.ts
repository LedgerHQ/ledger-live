/**
 * @jest-environment jsdom
 */
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { configureStore, type EnhancedStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, PostOnboardingState } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import postOnboardingReducer, { initialState as postOnboardingInitialState } from "../reducer";
import { usePostOnboardingPortfolioWidgetVisibility } from "./usePostOnboardingPortfolioWidgetVisibility";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";

type PortfolioWidgetTestState = {
  postOnboarding: PostOnboardingState;
  accountsFlat: AccountLike[];
};

type PortfolioWidgetTestStore = EnhancedStore<PortfolioWidgetTestState>;

const TestReduxProvider = Provider as ComponentType<{
  store: PortfolioWidgetTestStore;
  children?: ReactNode;
}>;

jest.mock("./usePostOnboardingEntryPointVisibleOnWallet");

const mockedEntryPointVisible = jest.mocked(usePostOnboardingEntryPointVisibleOnWallet);

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const accountWithFunds: Account = genAccount("portfolio-widget-funds", {
  currency: bitcoinCurrency,
});
accountWithFunds.balance = new BigNumber(1000);

const flattenAccountsSelector = (state: PortfolioWidgetTestState) => state.accountsFlat;

function createAccountsReducer(initial: AccountLike[]) {
  return function accountsFlatReducer(state: AccountLike[] = initial): AccountLike[] {
    return state;
  };
}

function createTestStore(overrides: {
  postOnboarding?: Partial<PostOnboardingState>;
  accountsFlat?: AccountLike[];
} = {}): PortfolioWidgetTestStore {
  const postOnboarding: PostOnboardingState = {
    ...postOnboardingInitialState,
    deviceModelId: DeviceModelId.nanoX,
    walletEntryPointEligibleForPortfolio: true,
    ...(overrides.postOnboarding ?? {}),
  };
  const accountsFlat = overrides.accountsFlat ?? [];

  return configureStore({
    reducer: {
      postOnboarding: postOnboardingReducer as never,
      accountsFlat: createAccountsReducer(accountsFlat),
    },
    preloadedState: {
      postOnboarding,
      accountsFlat,
    },
  }) as PortfolioWidgetTestStore;
}

function renderPortfolioWidgetHook(store: PortfolioWidgetTestStore) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestReduxProvider, { store }, children);

  return renderHook(
    () => usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector),
    { wrapper },
  );
}

describe("usePostOnboardingPortfolioWidgetVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEntryPointVisible.mockReturnValue(true);
  });

  it.each<
    Readonly<{
      desc: string;
      expected: boolean;
      postOnboarding?: Partial<PostOnboardingState>;
      accountsFlat?: AccountLike[];
    }>
  >([
    { desc: "all conditions met", expected: true },
    {
      desc: "Nano S excluded",
      postOnboarding: { deviceModelId: DeviceModelId.nanoS },
      expected: false,
    },
    {
      desc: "not eligible",
      postOnboarding: { walletEntryPointEligibleForPortfolio: false },
      expected: false,
    },
    {
      desc: "eligibility null + no funds",
      postOnboarding: { walletEntryPointEligibleForPortfolio: null },
      expected: true,
    },
    {
      desc: "eligibility null + has funds",
      postOnboarding: { walletEntryPointEligibleForPortfolio: null },
      accountsFlat: [accountWithFunds],
      expected: false,
    },
  ])("returns $expected when $desc", ({ expected, desc: _desc, postOnboarding, accountsFlat }) => {
    const store = createTestStore({ postOnboarding, accountsFlat });
    const { result } = renderPortfolioWidgetHook(store);
    expect(result.current.isPortfolioWidgetBaseVisible).toBe(expected);
  });

  it("returns false when entry point not visible", () => {
    mockedEntryPointVisible.mockReturnValue(false);
    const store = createTestStore();
    const { result } = renderPortfolioWidgetHook(store);
    expect(result.current.isPortfolioWidgetBaseVisible).toBe(false);
  });

  it("dispatches eligibility when null and device is set", async () => {
    const store = createTestStore({
      postOnboarding: {
        ...postOnboardingInitialState,
        deviceModelId: DeviceModelId.stax,
        walletEntryPointEligibleForPortfolio: null,
      },
    });
    renderPortfolioWidgetHook(store);
    await waitFor(() => {
      expect(store.getState().postOnboarding.walletEntryPointEligibleForPortfolio).not.toBe(null);
    });
    expect(store.getState().postOnboarding.walletEntryPointEligibleForPortfolio).toBe(true);
  });
});
