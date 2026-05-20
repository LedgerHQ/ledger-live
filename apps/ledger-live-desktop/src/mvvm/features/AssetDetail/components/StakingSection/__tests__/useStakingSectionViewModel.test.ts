import { renderHook, act } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { track } from "~/renderer/analytics/segment";
import { computeFiatPortionsFromDistribution } from "LLD/features/AssetDetail/utils/computeFiatPortionsFromDistribution";
import { useStakingSectionViewModel } from "../useStakingSectionViewModel";

const mockNavigate = jest.fn();
const mockGetCanStakeCurrency = jest.fn().mockReturnValue(false);
const mockUseInterestRatesByCurrencies = jest.fn().mockReturnValue({});

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({ getCanStakeCurrency: mockGetCanStakeCurrency }),
}));

jest.mock("@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies", () => ({
  useInterestRatesByCurrencies: (...args: unknown[]) => mockUseInterestRatesByCurrencies(...args),
}));

const btc = getCryptoCurrencyById("bitcoin");

const defaultSettingsState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
};

const discreetEnabledState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: true },
};

describe("useStakingSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCanStakeCurrency.mockReturnValue(false);
    mockUseInterestRatesByCurrencies.mockReturnValue({});
  });

  it("returns hidden state when the asset is not stakeable", () => {
    const account = genAccount("staking-btc", { currency: btc });
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    expect(result.current.state.type).toBe("hidden");
  });

  it("returns hidden state when there are no accounts", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const item = buildDistributionItem({ currency: btc, accounts: [] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    expect(result.current.state.type).toBe("hidden");
  });

  it("shows the default earn banner when stakeable without an earn deposit and no APY", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const account = genAccount("staking-btc-cards", { currency: btc });
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    expect(result.current.state.type).toBe("banner");
    if (result.current.state.type === "banner") {
      expect(result.current.state.label).toBe("Earn with this asset");
    }
  });

  it("shows APY in the earn banner when interest rate is available", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    mockUseInterestRatesByCurrencies.mockReturnValue({
      bitcoin: { value: 0.12, type: "APY" },
    });
    const account = genAccount("staking-btc-apy", { currency: btc });
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    expect(result.current.state.type).toBe("banner");
    if (result.current.state.type === "banner") {
      expect(result.current.state.label).toBe("Earn up to 12.0% APY");
    }
  });

  it("shows the default earn banner when APY is zero and there is no earn deposit", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    mockUseInterestRatesByCurrencies.mockReturnValue({
      bitcoin: { value: 0, type: "APY" },
    });
    const account = genAccount("staking-btc-zero-apy", { currency: btc });
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    expect(result.current.state.type).toBe("banner");
    if (result.current.state.type === "banner") {
      expect(result.current.state.label).toBe("Earn with this asset");
    }
  });

  it("shows staked balances in the app fiat currency when balance exceeds spendable balance", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const account = genAccount("staking-btc-deposit", { currency: btc });
    account.balance = new BigNumber(10);
    account.spendableBalance = new BigNumber(0);
    const item = buildDistributionItem({
      currency: btc,
      accounts: [account],
      amount: 10,
      countervalue: 50_000,
    });

    const { result } = renderHook(() => useStakingSectionViewModel(item), {
      initialState: defaultSettingsState,
    });

    expect(result.current.state.type).toBe("staked");
    if (result.current.state.type === "staked") {
      expect(result.current.state.formattedAvailable).toContain("$");
      expect(result.current.state.formattedDeposit).toMatch(/\$ ?500/);
    }
  });

  it("masks staked balances when discreet mode is enabled", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const account = genAccount("staking-btc-discreet", { currency: btc });
    account.balance = new BigNumber(10);
    account.spendableBalance = new BigNumber(0);
    const item = buildDistributionItem({
      currency: btc,
      accounts: [account],
      amount: 10,
      countervalue: 50_000,
    });

    const { result } = renderHook(() => useStakingSectionViewModel(item), {
      initialState: discreetEnabledState,
    });

    expect(result.current.state.type).toBe("staked");
    if (result.current.state.type === "staked") {
      expect(result.current.state.formattedAvailable).toContain("***");
      expect(result.current.state.formattedDeposit).toContain("***");
    }
  });

  it("aggregates earn deposit across accounts on multiple networks", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const accountA = genAccount("staking-btc-a", { currency: btc });
    accountA.balance = new BigNumber(10);
    accountA.spendableBalance = new BigNumber(4);
    const accountB = genAccount("staking-btc-b", { currency: btc });
    accountB.balance = new BigNumber(6);
    accountB.spendableBalance = new BigNumber(6);
    const item = buildDistributionItem({
      currency: btc,
      accounts: [accountA, accountB],
      amount: 16,
      countervalue: 160_000,
    });

    const { earnDepositFiat } = computeFiatPortionsFromDistribution(
      item,
      new BigNumber(10),
      new BigNumber(6),
    );
    expect(earnDepositFiat.toNumber()).toBe(60_000);

    const { result } = renderHook(() => useStakingSectionViewModel(item), {
      initialState: defaultSettingsState,
    });

    expect(result.current.state.type).toBe("staked");
    if (result.current.state.type === "staked") {
      expect(result.current.state.formattedDeposit).toMatch(/\$ ?600/);
    }
  });

  it("navigates to earn and tracks analytics on banner press", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const account = genAccount("staking-btc-nav", { currency: btc });
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    act(() => result.current.onEarnBannerPress());

    expect(mockNavigate).toHaveBeenCalledWith("/earn", {
      state: { intent: "deposit", cryptoAssetId: "bitcoin" },
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "earn_banner",
      currency: "bitcoin",
      page: "Asset detail",
    });
  });

  it("navigates to earn and tracks analytics on earn deposit press", () => {
    mockGetCanStakeCurrency.mockReturnValue(true);
    const account = genAccount("staking-btc-deposit-nav", { currency: btc });
    account.balance = new BigNumber(10);
    account.spendableBalance = new BigNumber(0);
    const item = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useStakingSectionViewModel(item));

    act(() => result.current.onEarnDepositPress());

    expect(mockNavigate).toHaveBeenCalledWith("/earn", {
      state: { intent: "deposit", cryptoAssetId: "bitcoin" },
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "earn_deposit",
      currency: "bitcoin",
      page: "Asset detail",
    });
  });
});
