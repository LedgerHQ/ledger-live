/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, PostOnboardingState } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { initialState as postOnboardingInitialState } from "../reducer";
import { usePostOnboardingPortfolioWidgetVisibility } from "./usePostOnboardingPortfolioWidgetVisibility";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";

type MockReduxState = {
  postOnboarding: PostOnboardingState;
  accountsFlat: AccountLike[];
};

const mockRedux = {
  dispatch: jest.fn(),
  state: undefined as MockReduxState | undefined,
};

jest.mock("react-redux", () => ({
  useDispatch: () => mockRedux.dispatch,
  useSelector: (selector: (state: MockReduxState) => unknown) =>
    selector(mockRedux.state as MockReduxState),
}));
jest.mock("./usePostOnboardingEntryPointVisibleOnWallet");

const mockedEntryPointVisible = jest.mocked(usePostOnboardingEntryPointVisibleOnWallet);

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const accountWithFunds: Account = genAccount("portfolio-widget-funds", {
  currency: bitcoinCurrency,
});
accountWithFunds.balance = new BigNumber(1000);

const flattenAccountsSelector = (state: MockReduxState) => state.accountsFlat;

function resetState(overrides: {
  postOnboarding?: Partial<PostOnboardingState>;
  accountsFlat?: AccountLike[];
} = {}) {
  mockRedux.state = {
    postOnboarding: {
      ...postOnboardingInitialState,
      deviceModelId: DeviceModelId.nanoX,
      walletEntryPointEligibleForPortfolio: true,
      ...(overrides.postOnboarding ?? {}),
    },
    accountsFlat: overrides.accountsFlat ?? [],
  };
}

describe("usePostOnboardingPortfolioWidgetVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEntryPointVisible.mockReturnValue(true);
    resetState();
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
    resetState({ postOnboarding, accountsFlat });
    const { result } = renderHook(() =>
      usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector),
    );
    expect(result.current.isPortfolioWidgetBaseVisible).toBe(expected);
  });

  it("returns false when entry point not visible", () => {
    mockedEntryPointVisible.mockReturnValue(false);
    const { result } = renderHook(() =>
      usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector),
    );
    expect(result.current.isPortfolioWidgetBaseVisible).toBe(false);
  });

  it("dispatches eligibility when null and device is set", async () => {
    resetState({
      postOnboarding: {
        ...postOnboardingInitialState,
        deviceModelId: DeviceModelId.stax,
        walletEntryPointEligibleForPortfolio: null,
      },
    });
    renderHook(() => usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector));
    await waitFor(() => {
      expect(mockRedux.dispatch).toHaveBeenCalled();
    });
  });
});
