import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type {
  RentOrderRejection,
  RentPayment,
} from "../../../bridge/generic-coin-framework/sponsored";
import type { Transaction } from "../../../generated/types";
import {
  SPONSORED_FAILURE_MESSAGE,
  formatSponsoredOfferedFee,
  formatSponsoredRetryTime,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isSponsoredRetryUnaffordable,
} from "./failure";
import { USDT_CONTRACT, USDT_RENT_PAYMENT as RENT } from "./fixtures/usdt";
import { SPONSORED_FAILURE_KIND, type SponsoredFailureKind } from "./types";

const PRICE_ROSE: RentOrderRejection = {
  reason: "priceAboveApproved",
  offered: { ...RENT, amount: 3_500_000n },
};

describe("getSponsoredFailureMessage", () => {
  it.each<[SponsoredFailureKind | null, RentOrderRejection | null, string | null]>([
    [SPONSORED_FAILURE_KIND.RENT_PAYMENT, null, SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT],
    [
      SPONSORED_FAILURE_KIND.RENT_PAYMENT,
      { reason: "insufficientBalance" },
      SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS,
    ],
    [SPONSORED_FAILURE_KIND.RENT_PAYMENT, PRICE_ROSE, SPONSORED_FAILURE_MESSAGE.PRICE_INCREASED],
    [SPONSORED_FAILURE_KIND.DELIVERY_FAILED, null, SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED],
    [SPONSORED_FAILURE_KIND.TRANSFER, null, SPONSORED_FAILURE_MESSAGE.TRANSFER],
    [null, null, null],
  ])("maps %s (%o) to %s", (failureKind, rentOrderRejection, expected) => {
    expect(
      getSponsoredFailureMessage({ failureKind, rentOrderRejection, retryLockedUntil: null }),
    ).toBe(expected);
  });

  it.each<[SponsoredFailureKind, string]>([
    [SPONSORED_FAILURE_KIND.RENT_PAYMENT, SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT_REPORTED_FAILED],
    [SPONSORED_FAILURE_KIND.DELIVERY_FAILED, SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED],
  ])("maps %s to %s while a sent payment may still land", (failureKind, expected) => {
    expect(
      getSponsoredFailureMessage({
        failureKind,
        rentOrderRejection: null,
        retryLockedUntil: Date.now() + 60_000,
      }),
    ).toBe(expected);
  });
});

describe("formatSponsoredOfferedFee", () => {
  it("formats the price an order above the approved fee asks", () => {
    expect(formatSponsoredOfferedFee({ rentOrderRejection: PRICE_ROSE }, "en")).toMatch(
      /^3\.5\sUSDT$/,
    );
  });

  it.each<[string, RentOrderRejection | null]>([
    ["no rejection", null],
    ["a short balance", { reason: "insufficientBalance" }],
  ])("is null after %s", (_label, rentOrderRejection) => {
    expect(formatSponsoredOfferedFee({ rentOrderRejection }, "en")).toBeNull();
  });
});

const localTime = (time: string) => new Date(`2026-10-08T${time}`).getTime();

describe("formatSponsoredRetryTime", () => {
  it("rounds up to the next minute", () => {
    expect(formatSponsoredRetryTime(localTime("14:32:10"), "en-GB")).toBe("14:33");
    expect(formatSponsoredRetryTime(localTime("14:33:00"), "en-GB")).toBe("14:33");
  });
});

describe("isSponsoredRetryUnaffordable", () => {
  const usdt = (spendable: number) =>
    ({
      id: "usdt",
      token: { contractAddress: USDT_CONTRACT },
      spendableBalance: new BigNumber(spendable),
      pendingOperations: [],
    }) as unknown as TokenAccount;
  const tronHolding = (tokenAccount: TokenAccount) =>
    ({ id: "tron", subAccounts: [tokenAccount] }) as unknown as Account;
  const transaction = { amount: new BigNumber(1_000_000) } as Transaction;
  const deliveryFailed = {
    failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
    rentPayment: RENT,
    rentOrderRejection: null,
  };
  const priceRose = {
    failureKind: SPONSORED_FAILURE_KIND.RENT_PAYMENT,
    rentPayment: null,
    rentOrderRejection: PRICE_ROSE,
  };

  it("blocks a delivery-failure retry the fee token can't pay a second time", () => {
    const tokenAccount = usdt(4_000_000);

    expect(
      isSponsoredRetryUnaffordable({
        state: deliveryFailed,
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction,
      }),
    ).toBe(true);
  });

  it("allows a delivery-failure retry the fee token still covers", () => {
    const tokenAccount = usdt(10_000_000);

    expect(
      isSponsoredRetryUnaffordable({
        state: deliveryFailed,
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction,
      }),
    ).toBe(false);
  });

  it("blocks accepting a price rise the balance can't pay, though the Review fee would fit", () => {
    const tokenAccount = usdt(4_400_000);

    expect(
      isSponsoredRetryUnaffordable({
        state: priceRose,
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction,
      }),
    ).toBe(true);
  });

  it("allows accepting a price rise the fee token covers", () => {
    const tokenAccount = usdt(4_500_000);

    expect(
      isSponsoredRetryUnaffordable({
        state: priceRose,
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction,
      }),
    ).toBe(false);
  });

  // The live quote drops its fee asset once the option is withdrawn; the paid rent keeps it.
  it("finds the fee token from the paid rent's asset", () => {
    const tokenAccount = usdt(10_000_000);
    const otherToken = { ...usdt(0), id: "other", token: { contractAddress: "TOther" } };
    const mainAccount = {
      id: "tron",
      subAccounts: [otherToken, tokenAccount],
    } as unknown as Account;

    expect(
      isSponsoredRetryUnaffordable({
        state: deliveryFailed,
        mainAccount,
        account: tokenAccount,
        transaction,
      }),
    ).toBe(false);
  });

  it.each<
    [
      string,
      SponsoredFailureKind,
      RentPayment | null,
      RentOrderRejection | null,
      Transaction | null,
    ]
  >([
    ["a failure that pays no new rent", SPONSORED_FAILURE_KIND.TRANSFER, RENT, null, transaction],
    [
      "a rent failure at the Review fee",
      SPONSORED_FAILURE_KIND.RENT_PAYMENT,
      null,
      null,
      transaction,
    ],
    ["no recorded rent", SPONSORED_FAILURE_KIND.DELIVERY_FAILED, null, null, transaction],
    ["no transaction", SPONSORED_FAILURE_KIND.DELIVERY_FAILED, RENT, null, null],
    [
      "a price rise without a transaction",
      SPONSORED_FAILURE_KIND.RENT_PAYMENT,
      null,
      PRICE_ROSE,
      null,
    ],
  ])("never blocks %s", (_label, failureKind, rentPayment, rentOrderRejection, tx) => {
    const tokenAccount = usdt(0);

    expect(
      isSponsoredRetryUnaffordable({
        state: { failureKind, rentPayment, rentOrderRejection },
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction: tx,
      }),
    ).toBe(false);
  });
});

describe("getSponsoredFailureFeeTicker", () => {
  it("prefers the paid rent's ticker over the quote's", () => {
    expect(getSponsoredFailureFeeTicker({ rentPayment: RENT }, "")).toBe("USDT");
  });

  it("falls back to the quote's ticker before anything is paid", () => {
    expect(getSponsoredFailureFeeTicker({ rentPayment: null }, "USDT")).toBe("USDT");
  });
});
