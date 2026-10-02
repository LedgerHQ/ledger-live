import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { RentPayment } from "../../../bridge/generic-coin-framework/sponsored";
import type { Transaction } from "../../../generated/types";
import {
  SPONSORED_FAILURE_MESSAGE,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isContractDataDisabledError,
  isSponsoredRetryUnaffordable,
} from "./failure";
import { USDT_CONTRACT, USDT_RENT_PAYMENT as RENT } from "./fixtures/usdt";
import { SPONSORED_FAILURE_KIND, type SponsoredFailureKind } from "./types";

const named = (name: string): Error => Object.assign(new Error(name), { name });

describe("getSponsoredFailureMessage", () => {
  it.each<[SponsoredFailureKind | null, Error | null, string | null]>([
    [SPONSORED_FAILURE_KIND.RENT_PAYMENT, named("Error"), SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT],
    [
      SPONSORED_FAILURE_KIND.RENT_PAYMENT,
      named("EnergyRentInsufficientBalance"),
      SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS,
    ],
    [SPONSORED_FAILURE_KIND.DELIVERY_FAILED, null, SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED],
    [SPONSORED_FAILURE_KIND.CONTRACT_DATA, null, SPONSORED_FAILURE_MESSAGE.CONTRACT_DATA],
    [SPONSORED_FAILURE_KIND.TRANSFER, null, SPONSORED_FAILURE_MESSAGE.TRANSFER],
    [null, null, null],
  ])("maps %s (%s) to %s", (failureKind, failureError, expected) => {
    expect(getSponsoredFailureMessage({ failureKind, failureError })).toBe(expected);
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
  const deliveryFailed = { failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED, rentPayment: RENT };

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

  it.each<[string, SponsoredFailureKind, RentPayment | null, Transaction | null]>([
    ["a failure that pays no new rent", SPONSORED_FAILURE_KIND.TRANSFER, RENT, transaction],
    ["no recorded rent", SPONSORED_FAILURE_KIND.DELIVERY_FAILED, null, transaction],
    ["no transaction", SPONSORED_FAILURE_KIND.DELIVERY_FAILED, RENT, null],
  ])("never blocks %s", (_label, failureKind, rentPayment, tx) => {
    const tokenAccount = usdt(0);

    expect(
      isSponsoredRetryUnaffordable({
        state: { failureKind, rentPayment },
        mainAccount: tronHolding(tokenAccount),
        account: tokenAccount,
        transaction: tx,
      }),
    ).toBe(false);
  });
});

describe("isContractDataDisabledError", () => {
  const transportError = (statusCode: number) =>
    Object.assign(new Error("refused"), { name: "TransportStatusError", statusCode });

  it.each<[string, unknown, boolean]>([
    ["the contract-data status", transportError(0x6a80), true],
    ["another status", transportError(0x6985), false],
    [
      "a plain object with the same fields",
      { name: "TransportStatusError", statusCode: 0x6a80 },
      false,
    ],
    ["null", null, false],
  ])("%s → %s", (_label, error, expected) => {
    expect(isContractDataDisabledError(error)).toBe(expected);
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
