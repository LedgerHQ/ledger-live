import { setEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import {
  BroadcastErrorType,
  BroadcastFlow,
  buildBroadcastCommonEvent,
  buildBroadcastFailureEvent,
  buildBroadcastSuccessEvent,
  categorizeBroadcastError,
  getBroadcastTransactionType,
} from "./broadcastLogEvent";

const mainAccount = {
  id: "main-account-id",
  type: "Account",
  currency: { id: "ethereum", family: "evm" },
} as unknown as Account;

const tokenAccount = {
  id: "sub-account-id",
  type: "TokenAccount",
  token: { id: "ethereum/erc20/usdc" },
} as unknown as AccountLike;

describe("buildBroadcastCommonEvent", () => {
  beforeEach(() => setEnv("LEDGER_CLIENT_VERSION", "llc/test"));

  it("builds the common fields for a native-account broadcast", () => {
    expect(
      buildBroadcastCommonEvent({
        account: mainAccount,
        mainAccount,
        flow: BroadcastFlow.WalletApiSignAndBroadcast,
        manifestId: "some-dapp",
        source: { type: "live-app", name: "some-dapp" },
        transactionType: "approve",
        isSendMax: true,
      }),
    ).toEqual({
      appVersion: "llc/test",
      flow: "wallet-api/transaction.signAndBroadcast",
      manifestId: "some-dapp",
      source: { type: "live-app", name: "some-dapp" },
      currencyId: "ethereum",
      family: "evm",
      transactionType: "approve",
      isTestnet: false,
      isSendMax: true,
    });
  });

  it("adds tokenId for token accounts and omits empty optionals", () => {
    const event = buildBroadcastCommonEvent({
      account: tokenAccount,
      mainAccount,
      flow: BroadcastFlow.Send,
    });
    expect(event.tokenId).toBe("ethereum/erc20/usdc");
    expect(event.manifestId).toBeUndefined();
    expect(event.transactionType).toBeUndefined();
    expect(event.isSendMax).toBe(false);
  });
});

describe("buildBroadcastSuccessEvent / buildBroadcastFailureEvent", () => {
  const common = buildBroadcastCommonEvent({
    account: mainAccount,
    mainAccount,
    flow: BroadcastFlow.Acre,
  });

  it("tags success", () => {
    expect(buildBroadcastSuccessEvent(common).status).toBe("success");
  });

  it("tags failure with normalized errorType and txPayload", () => {
    const signedOperation = {
      signature: "deadbeef",
      rawData: { psbt: "x" },
    } as unknown as SignedOperation;
    const event = buildBroadcastFailureEvent(
      common,
      new Error("insufficient_funds for transfer"),
      signedOperation,
    );
    expect(event.status).toBe("failure");
    expect(event.errorType).toBe(BroadcastErrorType.InsufficientFunds);
    expect(event.txPayload).toEqual({ signature: "deadbeef", rawData: { psbt: "x" } });
  });

  it("coerces non-Error throwables", () => {
    const event = buildBroadcastFailureEvent(common, "boom", {
      signature: "sig",
    } as unknown as SignedOperation);
    expect(event.error).toBeInstanceOf(Error);
    expect(event.error.message).toBe("boom");
  });
});

describe("categorizeBroadcastError", () => {
  it.each([
    [
      "InsufficientFunds (name)",
      { name: "InsufficientFunds" },
      BroadcastErrorType.InsufficientFunds,
    ],
    [
      "InvalidTransactionError (name)",
      { name: "InvalidTransactionError" },
      BroadcastErrorType.InvalidTransaction,
    ],
    [
      "SequenceNumberError (name)",
      { name: "SequenceNumberError" },
      BroadcastErrorType.NonceOrSequenceError,
    ],
    [
      "TronTransactionExpired (name)",
      { name: "TronTransactionExpired" },
      BroadcastErrorType.TransactionExpired,
    ],
    ["NetworkError (name)", { name: "NetworkError" }, BroadcastErrorType.NetworkError],
    [
      "NONCE_EXPIRED (message)",
      { message: "nonce_expired: foo" },
      BroadcastErrorType.NonceOrSequenceError,
    ],
    [
      "REPLACEMENT_UNDERPRICED (message)",
      { message: "replacement_underpriced" },
      BroadcastErrorType.ReplacementUnderpriced,
    ],
    [
      "UNPREDICTABLE_GAS_LIMIT (message)",
      { message: "cannot estimate gas; UNPREDICTABLE_GAS_LIMIT" },
      BroadcastErrorType.GasError,
    ],
    ["unknown", { name: "Error", message: "something weird" }, BroadcastErrorType.Unknown],
  ])("maps %s", (_label, partial, expected) => {
    const error = Object.assign(new Error(), partial) as Error;
    expect(categorizeBroadcastError(error)).toBe(expected);
  });
});

describe("getBroadcastTransactionType", () => {
  it("returns undefined when no transaction", () => {
    expect(getBroadcastTransactionType(undefined)).toBeUndefined();
  });

  it("reads mode for families that expose one (cosmos)", () => {
    const tx = { family: "cosmos", mode: "delegate" } as unknown as WalletAPITransaction;
    expect(getBroadcastTransactionType(tx)).toBe("delegate");
  });

  it("returns 'send' for families without a discriminator (bitcoin)", () => {
    const tx = { family: "bitcoin" } as unknown as WalletAPITransaction;
    expect(getBroadcastTransactionType(tx)).toBe("send");
  });

  it("reads solana model.kind", () => {
    const tx = {
      family: "solana",
      model: { kind: "token.transfer" },
    } as unknown as WalletAPITransaction;
    expect(getBroadcastTransactionType(tx)).toBe("token.transfer");
  });
});
