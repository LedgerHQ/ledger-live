import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { getCryptoCurrencyById } from "../currencies/index";
import { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getTotalStakeableAssets } from "./getTotalStakeableAssets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

// Setup mock store for unit tests
setupMockCryptoAssetsStore();

const ETH = getCryptoCurrencyById("ethereum");
const BTC = getCryptoCurrencyById("bitcoin");

// Create mock tokens for tests
const ZRX_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/0x_project",
  contractAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "0x Project",
  ticker: "ZRX",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "ZRX", code: "ZRX", magnitude: 18 }],
};

const REP_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/augur",
  contractAddress: "0x1985365e9f78359a9B6AD760e32412f4a445E862",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "Augur",
  ticker: "REP",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "REP", code: "REP", magnitude: 18 }],
};

const mockedAccounts: Account[] = [
  genAccount("mocked-account-1", {
    currency: ETH,
    tokensData: [ZRX_TOKEN, REP_TOKEN],
  }),
];

describe("getTotalStakeableAssets", () => {
  it("should return empty Set if no accounts", () => {
    const result = getTotalStakeableAssets([], [], []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return empty Set if accounts is null", () => {
    const result = getTotalStakeableAssets(null, [], []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return empty Set if accounts is undefined", () => {
    const result = getTotalStakeableAssets(undefined, [], []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return empty Set if no staking currencies enabled", () => {
    const result = getTotalStakeableAssets(mockedAccounts, [], []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return empty Set if staking currencies enabled is string (flag not loaded)", () => {
    const result = getTotalStakeableAssets(mockedAccounts, "flag not loaded", []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should return Set with matching currency ID when staking currency is enabled", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ETH.id]; // "ethereum"

    expect(account.balance).toBeTruthy();
    expect(account.balance instanceof BigNumber).toBe(true);
    expect(account.balance.gt(0)).toBe(true);

    const result = getTotalStakeableAssets([account], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(1);
    expect(result.has(ETH.id)).toBe(true);
  });

  it("should return Set with matching token IDs when staking tokens are enabled", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ZRX_TOKEN.id, REP_TOKEN.id];

    expect(account.subAccounts).toBeDefined();
    expect(account.subAccounts?.length).toBe(2);

    const result = getTotalStakeableAssets([account], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has(ZRX_TOKEN.id)).toBe(true);
    expect(result.has(REP_TOKEN.id)).toBe(true);
  });

  it("should return Set with both currency and token IDs when both are enabled", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ETH.id, ZRX_TOKEN.id, REP_TOKEN.id];

    const result = getTotalStakeableAssets([account], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result.has(ETH.id)).toBe(true);
    expect(result.has(ZRX_TOKEN.id)).toBe(true);
    expect(result.has(REP_TOKEN.id)).toBe(true);
  });

  it("should filter out currencies without funds", () => {
    const account = mockedAccounts[0];
    const accountWithZeroBalance = { ...account, balance: new BigNumber(0) };
    const stakingCurrenciesEnabled = [ETH.id];

    const result = getTotalStakeableAssets([accountWithZeroBalance], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should filter out tokens without funds", () => {
    const account = mockedAccounts[0];
    const [zrxAccount, repAccount] = account.subAccounts || [];
    const emptyRepAccount = { ...repAccount, balance: new BigNumber(0) };
    const accountWithEmptyToken = { ...account, subAccounts: [zrxAccount, emptyRepAccount] };
    const stakingCurrenciesEnabled = [ZRX_TOKEN.id, REP_TOKEN.id];

    const result = getTotalStakeableAssets([accountWithEmptyToken], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(1);
    expect(result.has(ZRX_TOKEN.id)).toBe(true);
    expect(result.has(REP_TOKEN.id)).toBe(false);
  });

  it("should include partner staking currencies enabled", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ETH.id];
    const partnerStakingCurrenciesEnabled = [ZRX_TOKEN.id];

    const result = getTotalStakeableAssets(
      [account],
      stakingCurrenciesEnabled,
      partnerStakingCurrenciesEnabled,
    );

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has(ETH.id)).toBe(true);
    expect(result.has(ZRX_TOKEN.id)).toBe(true);
  });

  it("should deduplicate IDs when same currency appears in both lists", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ETH.id];
    const partnerStakingCurrenciesEnabled = [ETH.id]; // Same currency

    const result = getTotalStakeableAssets(
      [account],
      stakingCurrenciesEnabled,
      partnerStakingCurrenciesEnabled,
    );

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(1);
    expect(result.has(ETH.id)).toBe(true);
  });

  it("should handle multiple accounts with different currencies", () => {
    const ethAccount = mockedAccounts[0];
    const btcAccount = genAccount("mocked-account-2", {
      currency: BTC,
    });
    const accounts = [ethAccount, btcAccount];
    const stakingCurrenciesEnabled = [ETH.id, BTC.id];

    const result = getTotalStakeableAssets(accounts, stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has(ETH.id)).toBe(true);
    expect(result.has(BTC.id)).toBe(true);
  });

  it("should only include IDs that match staking currencies enabled", () => {
    const account = mockedAccounts[0];
    const stakingCurrenciesEnabled = [ZRX_TOKEN.id]; // Only ZRX enabled, not ETH or REP

    const result = getTotalStakeableAssets([account], stakingCurrenciesEnabled, []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(1);
    expect(result.has(ZRX_TOKEN.id)).toBe(true);
    expect(result.has(ETH.id)).toBe(false);
    expect(result.has(REP_TOKEN.id)).toBe(false);
  });

  it("should handle empty arrays for staking currencies", () => {
    const account = mockedAccounts[0];
    const result = getTotalStakeableAssets([account], [], []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("should handle undefined for staking currencies", () => {
    const account = mockedAccounts[0];
    const result = getTotalStakeableAssets([account], undefined, undefined);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });
});
