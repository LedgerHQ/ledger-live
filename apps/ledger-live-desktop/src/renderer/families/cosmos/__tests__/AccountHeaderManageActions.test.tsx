import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { renderHook } from "tests/testSetup";

import AccountHeaderActions from "../AccountHeaderManageActions";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/config/index"),
}));

const currency = getCryptoCurrencyById("cosmos");

const makeAccount = (): CosmosAccount =>
  ({
    ...genAccount("cosmos-test", { currency }),
  }) as unknown as CosmosAccount;

function mockGetCurrencyConfiguration(currencyConfig: Record<string, unknown>) {
  jest
    .spyOn(config, "getCurrencyConfiguration")
    .mockReturnValue(currencyConfig as unknown as CurrencyConfig);
}

function mockGetCurrencyConfigurationThrowing() {
  jest.spyOn(config, "getCurrencyConfiguration").mockImplementation(() => {
    throw new Error("No currency configuration available for cosmos");
  });
}

describe("AccountHeaderManageActions (cosmos)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns no actions when the currency config disables delegation", () => {
    mockGetCurrencyConfiguration({ disableDelegation: true });
    const account = makeAccount();

    const { result } = renderHook(() =>
      AccountHeaderActions({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toEqual([]);
  });

  it("still returns the Stake action when disableDelegation is false", () => {
    mockGetCurrencyConfiguration({ disableDelegation: false });
    const account = makeAccount();

    const { result } = renderHook(() =>
      AccountHeaderActions({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0]).toMatchObject({ key: "Stake" });
  });

  it("still returns the Stake action when the config carries no disableDelegation key", () => {
    // Most Cosmos chains don't set this key at all — the `in` narrowing must not misfire on them.
    mockGetCurrencyConfiguration({});
    const account = makeAccount();

    const { result } = renderHook(() =>
      AccountHeaderActions({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0]).toMatchObject({ key: "Stake" });
  });

  it("still returns null for a sub-account regardless of disableDelegation", () => {
    mockGetCurrencyConfiguration({ disableDelegation: true });
    const account = makeAccount();

    const { result } = renderHook(() =>
      AccountHeaderActions({ account, parentAccount: account, source: "Account Page" }),
    );

    expect(result.current).toBeNull();
  });

  it("keeps the Stake action and does not throw when the currency has no config entry", () => {
    // Regression guard: before the disableDelegation gate existed this function never called
    // getCurrencyConfiguration, so it could not throw. It throws on an absent config key, and
    // `crypto_org_croeseid` is in the cosmos supportedCoins list with no config entry. Two of the
    // three consumers of this decorator — the StartStake modal and the Receive staking step —
    // render without AccountBalanceSummaryFooter, so nothing else would catch it there.
    mockGetCurrencyConfigurationThrowing();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const account = makeAccount();

    const { result } = renderHook(() =>
      AccountHeaderActions({ account, parentAccount: null, source: "Account Page" }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0]).toMatchObject({ key: "Stake" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
