import { setEnv } from "@shared/env";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import {
  ErrorCategory,
  TransactionFlow,
  TransactionStage,
  buildTransactionCommonEvent,
  buildTransactionAbandonedEvent,
  buildTransactionFailureEvent,
  buildTransactionStartedEvent,
  buildTransactionSuccessEvent,
  classifyTransactionError,
  getStakeTarget,
  getRawTransactionType,
} from "./logEvent";

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

describe("buildTransactionCommonEvent", () => {
  beforeEach(() => setEnv("LEDGER_CLIENT_VERSION", "llc/test"));

  it("builds the common fields for a native-account transaction", () => {
    expect(
      buildTransactionCommonEvent({
        account: mainAccount,
        mainAccount,
        flow: TransactionFlow.WalletApiSignAndBroadcast,
        manifestId: "some-dapp",
        source: { type: "live-app", name: "some-dapp" },
        rawTransactionType: "approve",
        isSendMax: true,
      }),
    ).toEqual({
      appVersion: "llc/test",
      flow: "wallet-api/transaction.signAndBroadcast",
      manifestId: "some-dapp",
      source: { type: "live-app", name: "some-dapp" },
      currencyId: "ethereum",
      family: "evm",
      earnTransactionType: "approve",
      rawTransactionType: "approve",
      isTestnet: false,
      isSendMax: true,
    });
  });

  it("normalizes the raw action per family and keeps the raw value", () => {
    const solanaAccount = {
      type: "Account",
      currency: { id: "solana", family: "solana" },
    } as unknown as Account;
    const event = buildTransactionCommonEvent({
      account: solanaAccount,
      mainAccount: solanaAccount,
      flow: TransactionFlow.Send,
      rawTransactionType: "stake.createAccount",
    });
    expect(event.earnTransactionType).toBe("delegate");
    expect(event.rawTransactionType).toBe("stake.createAccount");
  });

  it("leaves earnTransactionType undefined for a non-staking action but keeps the raw value", () => {
    const event = buildTransactionCommonEvent({
      account: mainAccount,
      mainAccount,
      flow: TransactionFlow.Send,
      rawTransactionType: "swap",
    });
    expect(event.earnTransactionType).toBeUndefined();
    expect(event.rawTransactionType).toBe("swap");
  });

  it("adds tokenId for token accounts and omits empty optionals", () => {
    const event = buildTransactionCommonEvent({
      account: tokenAccount,
      mainAccount,
      flow: TransactionFlow.Send,
    });
    expect(event.tokenId).toBe("ethereum/erc20/usdc");
    expect(event.manifestId).toBeUndefined();
    expect(event.earnTransactionType).toBeUndefined();
    expect(event.isSendMax).toBe(false);
  });
});

describe("buildTransactionSuccessEvent / buildTransactionFailureEvent", () => {
  const common = buildTransactionCommonEvent({
    account: mainAccount,
    mainAccount,
    flow: TransactionFlow.Acre,
  });

  it("tags success as a broadcast-stage success", () => {
    const event = buildTransactionSuccessEvent(common);
    expect(event.status).toBe("success");
    expect(event.stage).toBe(TransactionStage.Broadcast);
  });

  it("tags a broadcast failure with category, stage and txPayload", () => {
    const signedOperation = {
      signature: "deadbeef",
      rawData: { psbt: "x" },
    } as unknown as SignedOperation;
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Broadcast,
      error: new Error("insufficient_funds for transfer"),
      signedOperation,
    });
    expect(event.status).toBe("failure");
    expect(event.stage).toBe(TransactionStage.Broadcast);
    expect(event.errorCategory).toBe(ErrorCategory.GasInsufficientBalance);
    expect(event.txPayload).toEqual({ signature: "deadbeef", rawData: { psbt: "x" } });
  });

  it("tags a sign failure with no txPayload (signing never completed)", () => {
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Sign,
      error: Object.assign(new Error(), { name: "UserRefusedOnDevice" }),
    });
    expect(event.stage).toBe(TransactionStage.Sign);
    expect(event.errorCategory).toBe(ErrorCategory.UserDeviceRefused);
    expect(event.txPayload).toBeUndefined();
  });

  it("coerces non-Error throwables", () => {
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Broadcast,
      error: "boom",
    });
    expect(event.error).toBeInstanceOf(Error);
    expect(event.error.message).toBe("boom");
  });

  it("builds a started (funnel-top) event", () => {
    const event = buildTransactionStartedEvent(common, TransactionStage.Sign);
    expect(event.status).toBe("started");
    expect(event.stage).toBe(TransactionStage.Sign);
    expect(event.currencyId).toBe("ethereum");
  });

  it("builds an abandoned event as a UserModalDismissed sign failure", () => {
    const event = buildTransactionAbandonedEvent(common);
    expect(event.status).toBe("failure");
    expect(event.stage).toBe(TransactionStage.Sign);
    expect(event.errorCategory).toBe(ErrorCategory.UserModalDismissed);
    expect(event.txPayload).toBeUndefined();
  });
});

// Neither the Wallet API's RpcError/ServerError nor Ledger Wallet's dApp-path RpcError
// sets `name`, so without unwrapping every RPC failure would be unknown/"Error".
describe("buildTransactionFailureEvent — RPC envelope unwrapping", () => {
  const common = buildTransactionCommonEvent({
    account: mainAccount,
    mainAccount,
    flow: TransactionFlow.Dapp,
  });

  const failure = (error: unknown) =>
    buildTransactionFailureEvent(common, { stage: TransactionStage.Sign, error });

  it("unwraps a dApp provider rejection (EIP-1193 4001) as a dismissal", () => {
    const event = failure({ isRpcError: true, code: 4001, reason: "User rejected" });
    expect(event.errorCategory).toBe(ErrorCategory.UserModalDismissed);
    expect(event.error.name).toBe("UserRejectedRequest");
  });

  it("keeps the rpc code as the reported name for other provider errors", () => {
    const event = failure({ isRpcError: true, code: 4900, reason: "Disconnected" });
    expect(event.error.name).toBe("rpc_4900");
  });

  it("unwraps the original error forwarded inside a Wallet API envelope", () => {
    const event = failure({
      getCode: () => -32000,
      getData: () => ({
        code: "UNKNOWN_ERROR",
        data: { name: "UserRefusedOnDevice", message: "declined" },
      }),
    });
    expect(event.errorCategory).toBe(ErrorCategory.UserDeviceRefused);
    expect(event.error.name).toBe("UserRefusedOnDevice");
  });

  it("preserves a nested device status code so it can still be categorised", () => {
    const event = failure({
      getCode: () => -32000,
      getData: () => ({
        code: "UNKNOWN_ERROR",
        data: { name: "DeviceStatusError", message: "", statusCode: 0x6985 },
      }),
    });
    expect(event.errorCategory).toBe(ErrorCategory.UserDeviceRefused);
  });

  it("falls back to the protocol code as the reported name", () => {
    const event = failure({
      getCode: () => -32000,
      getData: () => ({ code: "ACCOUNT_NOT_FOUND" }),
    });
    expect(event.error.name).toBe("ACCOUNT_NOT_FOUND");
    expect(event.errorCategory).toBe(ErrorCategory.Unknown);
  });

  it("leaves a plain error untouched", () => {
    const event = failure(Object.assign(new Error("x"), { name: "NotEnoughBalance" }));
    expect(event.error.name).toBe("NotEnoughBalance");
    expect(event.errorCategory).toBe(ErrorCategory.GasInsufficientBalance);
  });
});

describe("classifyTransactionError", () => {
  it.each([
    // device / user (sign stage)
    ["DisconnectedDevice", { name: "DisconnectedDevice" }, ErrorCategory.DeviceDisconnected],
    [
      "DisconnectedDeviceDuringOperation",
      { name: "DisconnectedDeviceDuringOperation" },
      ErrorCategory.DeviceDisconnected,
    ],
    ["WrongDeviceForAccount", { name: "WrongDeviceForAccount" }, ErrorCategory.DeviceWrongAccount],
    ["UserRefusedOnDevice", { name: "UserRefusedOnDevice" }, ErrorCategory.UserDeviceRefused],
    [
      "TransactionRefusedOnDevice",
      { name: "TransactionRefusedOnDevice" },
      ErrorCategory.UserDeviceRefused,
    ],
    [
      "DeviceStatusError user-decline (0x6985)",
      { name: "DeviceStatusError", statusCode: 0x6985 },
      ErrorCategory.UserDeviceRefused,
    ],
    [
      "DeviceStatusError other status",
      { name: "DeviceStatusError", statusCode: 0x6a80 },
      ErrorCategory.DeviceDisconnected,
    ],
    [
      "Signature interrupted (message)",
      { message: "Signature interrupted by user" },
      ErrorCategory.UserModalDismissed,
    ],
    [
      "Canceled by user (message)",
      { message: "Canceled by user" },
      ErrorCategory.UserModalDismissed,
    ],
    // gas / blockchain (broadcast stage)
    ["InsufficientFunds", { name: "InsufficientFunds" }, ErrorCategory.GasInsufficientBalance],
    ["NotEnoughBalance", { name: "NotEnoughBalance" }, ErrorCategory.GasInsufficientBalance],
    [
      "REPLACEMENT_UNDERPRICED (message)",
      { message: "replacement_underpriced" },
      ErrorCategory.GasFeeTooLow,
    ],
    ["SequenceNumberError", { name: "SequenceNumberError" }, ErrorCategory.Blockchain],
    ["NetworkError", { name: "NetworkError" }, ErrorCategory.Blockchain],
    ["NONCE_EXPIRED (message)", { message: "nonce_expired: foo" }, ErrorCategory.Blockchain],
    ["unknown", { name: "Error", message: "something weird" }, ErrorCategory.Unknown],
  ])("maps %s", (_label, partial, expected) => {
    const error = Object.assign(new Error(), partial) as Error;
    expect(classifyTransactionError(error)).toBe(expected);
  });
});

describe("getStakeTarget", () => {
  it("reads Cardano poolId as a single-element list", () => {
    const tx = { family: "cardano", mode: "delegate", poolId: "pool123" } as never;
    expect(getStakeTarget(tx)).toEqual(["pool123"]);
  });

  it("reads cosmos validators[].address", () => {
    const tx = {
      family: "cosmos",
      validators: [{ address: "cosmosvaloper1", amount: "1" }, { address: "cosmosvaloper2" }],
    } as never;
    expect(getStakeTarget(tx)).toEqual(["cosmosvaloper1", "cosmosvaloper2"]);
  });

  it("reads polkadot validators[] and tron votes[].address", () => {
    expect(getStakeTarget({ family: "polkadot", validators: ["v1", "v2"] } as never)).toEqual([
      "v1",
      "v2",
    ]);
    expect(
      getStakeTarget({ family: "tron", votes: [{ address: "TRX1", voteCount: 1 }] } as never),
    ).toEqual(["TRX1"]);
  });

  it("reads solana delegate vote account and hedera staking node id", () => {
    expect(
      getStakeTarget({ family: "solana", model: { uiState: { voteAccAddr: "vote1" } } } as never),
    ).toEqual(["vote1"]);
    expect(getStakeTarget({ family: "hedera", stakingNodeId: 7 } as never)).toEqual(["7"]);
  });

  it("returns undefined for recipient-overloading families and non-staking txs", () => {
    expect(getStakeTarget({ family: "tezos", recipient: "tz1baker" } as never)).toBeUndefined();
    expect(getStakeTarget({ family: "cardano", mode: "send" } as never)).toBeUndefined();
    expect(getStakeTarget(undefined)).toBeUndefined();
  });
});

describe("getRawTransactionType", () => {
  it("returns undefined when no transaction", () => {
    expect(getRawTransactionType(undefined)).toBeUndefined();
  });

  it("reads mode for families that expose one (cosmos)", () => {
    const tx = { family: "cosmos", mode: "delegate" } as unknown as WalletAPITransaction;
    expect(getRawTransactionType(tx)).toBe("delegate");
  });

  it("returns 'send' for families without a discriminator (bitcoin)", () => {
    const tx = { family: "bitcoin" } as unknown as WalletAPITransaction;
    expect(getRawTransactionType(tx)).toBe("send");
  });

  it("reads solana model.kind", () => {
    const tx = {
      family: "solana",
      model: { kind: "token.transfer" },
    } as unknown as WalletAPITransaction;
    expect(getRawTransactionType(tx)).toBe("token.transfer");
  });
});
