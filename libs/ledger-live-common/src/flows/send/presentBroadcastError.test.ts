import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { TransactionBroadcastError } from "../../errors/transactionBroadcastErrors";
import {
  isSendConfirmationRetryable,
  presentBroadcastError,
  toBroadcastError,
} from "./presentBroadcastError";

const ethereumAccount = {
  type: "Account",
  currency: { name: "Ethereum", ticker: "ETH" },
} as Account;

const tokenAccount = {
  type: "TokenAccount",
  token: { ticker: "USDT" },
} as TokenAccount;

describe("presentBroadcastError", () => {
  it("should wrap a node rejection as a broadcast error with both app interpolation fields", () => {
    const error = Object.assign(new Error("Insufficient funds for gas * price + value"), {
      name: "LedgerAPI4xx",
    });

    const presented = presentBroadcastError(error, tokenAccount, ethereumAccount);

    expect(presented).toBeInstanceOf(TransactionBroadcastError);
    expect(presented).toMatchObject({
      name: "TransactionBroadcastError",
      message: error.message,
      coin: "USDT",
      network: "Ethereum",
      currencyName: "USDT",
      networkName: "Ethereum",
    });
  });

  it("should keep an invalid transaction error", () => {
    const error = Object.assign(new Error("transaction is already known"), {
      name: "InvalidTransactionError",
    });

    expect(presentBroadcastError(error, ethereumAccount, null)).toBe(error);
  });

  it("should keep a node rejection closed and a server error retryable", () => {
    const rejected = Object.assign(new Error("insufficient funds"), { name: "LedgerAPI4xx" });
    const unavailable = Object.assign(new Error("upstream down"), { name: "LedgerAPI5xx" });

    const presentedRejection = presentBroadcastError(rejected, ethereumAccount, null);
    expect(isSendConfirmationRetryable(presentedRejection)).toBe(false);
    expect(
      isSendConfirmationRetryable(presentBroadcastError(unavailable, ethereumAccount, null)),
    ).toBe(true);
  });

  it("should offer a retry for a network error that is not wrapped", () => {
    const networkError = Object.assign(new Error("down"), { name: "NetworkDown" });
    expect(isSendConfirmationRetryable(networkError)).toBe(true);
  });

  it("should keep an explicit retryable flag from the original error", () => {
    const error = Object.assign(new Error("try later"), {
      name: "SomeBridgeError",
      retryable: true,
    });

    expect(isSendConfirmationRetryable(presentBroadcastError(error, ethereumAccount, null))).toBe(
      true,
    );
  });

  it.each([
    "LedgerAPI5xx",
    "NetworkDown",
    "DeviceLockedError",
    "LockedDeviceError",
    "UserRefusedOnDevice",
  ])("should keep %s retryable once presented", name => {
    const error = Object.assign(new Error(name), { name });

    expect(isSendConfirmationRetryable(presentBroadcastError(error, ethereumAccount, null))).toBe(
      true,
    );
  });

  it("should present a token account error without a parent account", () => {
    const error = Object.assign(new Error("rejected"), { name: "LedgerAPI4xx" });

    const presented = presentBroadcastError(error, tokenAccount, null);

    expect(presented).toMatchObject({
      name: "TransactionBroadcastError",
      coin: "USDT",
      network: undefined,
    });
    expect(isSendConfirmationRetryable(presented)).toBe(false);
  });

  it("should keep a serialized network error retryable", () => {
    const presented = presentBroadcastError(
      { name: "NetworkDown", message: "offline" },
      ethereumAccount,
      null,
    );

    expect(presented).toMatchObject({ name: "TransactionBroadcastError", message: "offline" });
    expect(isSendConfirmationRetryable(presented)).toBe(true);
  });

  it("should keep the retryable flag of a serialized error", () => {
    const presented = presentBroadcastError(
      { name: "SomeBridgeError", message: "try later", retryable: true },
      ethereumAccount,
      null,
    );

    expect(isSendConfirmationRetryable(presented)).toBe(true);
  });

  it("should keep a serialized invalid transaction error as is", () => {
    const presented = presentBroadcastError(
      { name: "InvalidTransactionError", message: "bad tx" },
      ethereumAccount,
      null,
    );

    expect(presented).toBeInstanceOf(Error);
    expect(presented).toMatchObject({ name: "InvalidTransactionError", message: "bad tx" });
  });

  it("should describe a rejection without a message", () => {
    expect(toBroadcastError({ code: 42 }).message).toBe('{"code":42}');
    expect(toBroadcastError("offline").message).toBe("offline");
  });

  it("should return the original error when there is no account", () => {
    const error = new Error("missing account");

    expect(presentBroadcastError(error, null, null)).toBe(error);
  });
});
