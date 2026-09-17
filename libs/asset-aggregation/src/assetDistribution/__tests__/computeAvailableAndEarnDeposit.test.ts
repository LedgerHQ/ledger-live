import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { computeAvailableAndEarnDeposit } from "../computeAvailableAndEarnDeposit";

function makeCurrency(magnitude: number): CryptoCurrency {
  return { units: [{ magnitude }] } as unknown as CryptoCurrency;
}

function makeAccount(balance: number | string, spendable: number | string, magnitude = 8): Account {
  return {
    type: "Account",
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendable),
    currency: makeCurrency(magnitude),
  } as unknown as Account;
}

function makeTokenAccount(
  balance: number | string,
  spendable: number | string,
  tokenMagnitude: number,
): TokenAccount {
  const token = { units: [{ magnitude: tokenMagnitude }] } as unknown as TokenCurrency;
  return {
    type: "TokenAccount",
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendable),
    token,
  } as unknown as TokenAccount;
}

describe("computeAvailableAndEarnDeposit", () => {
  it("returns zero deposit when spendable equals total balance", () => {
    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit(
      [makeAccount(10, 10)],
      8,
    );

    expect(availableBalance.toNumber()).toBe(10);
    expect(earnDeposit.toNumber()).toBe(0);
  });

  it("aggregates earn deposit across multiple accounts", () => {
    const { earnDeposit } = computeAvailableAndEarnDeposit(
      [makeAccount(10, 4), makeAccount(6, 6)],
      8,
    );

    expect(earnDeposit.toNumber()).toBe(6);
  });

  it("clamps negative deposit to zero when spendable exceeds balance", () => {
    const { earnDeposit } = computeAvailableAndEarnDeposit([makeAccount(4, 10)], 8);

    expect(earnDeposit.toNumber()).toBe(0);
  });

  it("normalizes cross-network balances to the reference magnitude before summing", () => {
    // Regression for LIVE-37582: DADA groups Tezos (mag 6) + Etherlink (mag 18) accounts.
    const tezosAccount = makeAccount(1_000_000, 700_000, 8); // stand-in, mag 8
    const ethAccount = makeAccount("1000000000000000000", "1000000000000000000", 18); // mag 18

    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit(
      [tezosAccount, ethAccount],
      8,
    );

    expect(availableBalance.toNumber()).toBe(100_700_000);
    expect(earnDeposit.toNumber()).toBe(300_000);
  });

  it("returns zero for both values when accounts array is empty", () => {
    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit([], 8);

    expect(availableBalance.toNumber()).toBe(0);
    expect(earnDeposit.toNumber()).toBe(0);
  });

  it("reads magnitude from token field for TokenAccount type", () => {
    // TokenAccount uses acc.token.units[0].magnitude, not acc.currency.
    // Reference magnitude 6; token magnitude 18 → shift = -12.
    // spendable: 5e17 × 10^-12 = 500_000; total: 1e18 × 10^-12 = 1_000_000.
    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit(
      [makeTokenAccount("1000000000000000000", "500000000000000000", 18)],
      6,
    );

    expect(availableBalance.toNumber()).toBe(500_000);
    expect(earnDeposit.toNumber()).toBe(500_000);
  });

  it("handles all-staked accounts where spendable is zero", () => {
    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit(
      [makeAccount(1_000_000, 0)],
      8,
    );

    expect(availableBalance.toNumber()).toBe(0);
    expect(earnDeposit.toNumber()).toBe(1_000_000);
  });

  it("is a no-op when all accounts share the same magnitude", () => {
    // Verifies the fix does not alter behaviour for single-network coins.
    const { availableBalance, earnDeposit } = computeAvailableAndEarnDeposit(
      [
        makeAccount("3000000000000000000", "1000000000000000000", 18),
        makeAccount("2000000000000000000", "2000000000000000000", 18),
      ],
      18,
    );

    expect(availableBalance.toNumber()).toBe(3e18);
    expect(earnDeposit.toNumber()).toBe(2e18);
  });
});
