import { BigNumber } from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { SponsoredFeeAsset } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import {
  TRON_USDT_CONTRACT,
  TRON_USDT_FEE_ASSET,
  createMockAccount,
  createMockCurrency,
  createMockTronUsdtAccount,
} from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import {
  findFeeTokenAccount,
  isSponsoredFeeUnaffordable,
  sponsoredMaxAmount,
  tokenSpendableAfterPending,
} from "../sponsoredFeeAsset";

const RENT = 3_200_000n;

const pendingOut = (value: number): Operation => ({
  id: `pending-out-${value}`,
  hash: `hash-${value}`,
  type: "OUT",
  value: new BigNumber(value),
  fee: new BigNumber(0),
  senders: ["TPayer"],
  recipients: ["TRecipient"],
  blockHeight: null,
  blockHash: null,
  accountId: "mock_tron_usdt_account_id",
  date: new Date(0),
  extra: {},
});

const usdtWith = (spendable: number, pendingOperations: Operation[] = []): TokenAccount =>
  createMockTronUsdtAccount({
    balance: new BigNumber(spendable),
    spendableBalance: new BigNumber(spendable),
    pendingOperations,
  });

const tronParent = (subAccounts: TokenAccount[]): Account =>
  createMockAccount({ currency: createMockCurrency({ id: "tron" }), subAccounts });

const send = (amount: number, useAllAmount = false) => ({
  amount: new BigNumber(amount),
  useAllAmount,
});

describe("findFeeTokenAccount", () => {
  it("returns the sub-account holding the fee asset's contract", () => {
    const usdt = usdtWith(10_000_000);

    expect(findFeeTokenAccount(tronParent([usdt]), TRON_USDT_FEE_ASSET)).toBe(usdt);
  });

  it.each<[string, Account | null, SponsoredFeeAsset | null]>([
    ["no main account", null, TRON_USDT_FEE_ASSET],
    ["no fee asset", tronParent([usdtWith(1)]), null],
    ["a native fee asset", tronParent([usdtWith(1)]), { type: "native" }],
    ["no matching sub-account", tronParent([]), TRON_USDT_FEE_ASSET],
    [
      "a contract that differs only in case",
      tronParent([usdtWith(1)]),
      { type: "trc20", assetReference: TRON_USDT_CONTRACT.toLowerCase() },
    ],
  ])("returns null for %s", (_label, mainAccount, feeAsset) => {
    expect(findFeeTokenAccount(mainAccount, feeAsset)).toBeNull();
  });
});

describe("tokenSpendableAfterPending", () => {
  it("subtracts unsynced outgoing ops from the spendable balance", () => {
    expect(
      tokenSpendableAfterPending(usdtWith(10_000_000, [pendingOut(3_200_000)])).toString(),
    ).toBe("6800000");
  });

  it("never goes below zero", () => {
    expect(tokenSpendableAfterPending(usdtWith(1_000, [pendingOut(3_200_000)])).toString()).toBe(
      "0",
    );
  });
});

describe("isSponsoredFeeUnaffordable", () => {
  it("fails closed without a fee-token account", () => {
    expect(
      isSponsoredFeeUnaffordable({
        account: tronParent([]),
        transaction: send(1),
        feeTokenAccount: null,
        rentValue: RENT,
      }),
    ).toBe(true);
  });

  describe("when the send spends the fee token", () => {
    it.each([
      [6_800_000, false],
      [6_800_001, true],
    ])("amount %d out of 10 USDT → unaffordable: %s", (amount, expected) => {
      const usdt = usdtWith(10_000_000);

      expect(
        isSponsoredFeeUnaffordable({
          account: usdt,
          transaction: send(amount),
          feeTokenAccount: usdt,
          rentValue: RENT,
        }),
      ).toBe(expected);
    });

    it("counts unsynced outgoing ops against the balance", () => {
      const usdt = usdtWith(10_000_000, [pendingOut(1_000_000)]);

      expect(
        isSponsoredFeeUnaffordable({
          account: usdt,
          transaction: send(6_000_000),
          feeTokenAccount: usdt,
          rentValue: RENT,
        }),
      ).toBe(true);
    });

    it("treats Max as the whole balance until it is snapped to an amount", () => {
      const usdt = usdtWith(10_000_000);

      expect(
        isSponsoredFeeUnaffordable({
          account: usdt,
          transaction: send(0, true),
          feeTokenAccount: usdt,
          rentValue: RENT,
        }),
      ).toBe(true);
    });
  });

  describe("when the send spends another asset", () => {
    it.each([
      [3_200_000, false],
      [3_199_999, true],
    ])("a %d USDT balance → unaffordable: %s", (spendable, expected) => {
      const usdt = usdtWith(spendable);

      expect(
        isSponsoredFeeUnaffordable({
          account: tronParent([usdt]),
          transaction: send(50_000_000),
          feeTokenAccount: usdt,
          rentValue: RENT,
        }),
      ).toBe(expected);
    });
  });
});

describe("sponsoredMaxAmount", () => {
  it("leaves the rent plus a 1% margin", () => {
    expect(sponsoredMaxAmount(usdtWith(10_000_000), RENT).toString()).toBe("6768000");
  });

  it("rounds the margin up", () => {
    expect(sponsoredMaxAmount(usdtWith(1_000), 150n).toString()).toBe("848");
  });

  it("counts unsynced outgoing ops against the balance", () => {
    expect(sponsoredMaxAmount(usdtWith(10_000_000, [pendingOut(1_000_000)]), RENT).toString()).toBe(
      "5768000",
    );
  });

  it("is zero when the balance covers exactly the rent and its margin", () => {
    expect(sponsoredMaxAmount(usdtWith(3_232_000), RENT).toString()).toBe("0");
  });

  it("is not positive when the balance can't cover the rent", () => {
    expect(sponsoredMaxAmount(usdtWith(3_000_000), RENT).lte(0)).toBe(true);
  });
});
