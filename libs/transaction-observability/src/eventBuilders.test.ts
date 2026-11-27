import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { setEnv } from "@shared/env";
import {
  buildBroadcastCommonEvent,
  buildSignCommonEvent,
  buildTransactionAbandonedEvent,
  buildTransactionFailureEvent,
  buildTransactionIntentEvent,
  buildTransactionSuccessEvent,
} from "./eventBuilders";
import { TransactionDataSource, TransactionPathway, TransactionStage } from "./logEvent";
import { ErrorCategory } from "./errorCategory";
import type { TransactionLike } from "./transactionShape";
import { clearPendingTxLifecycle, sendTxLifecycle, toTxLifecyclePayload } from "./txLifecycle";

const account = (currency: { id: string; family: string; ticker: string }) =>
  ({ id: "account-id", type: "Account", currency }) as unknown as Account;

const cardano = account({ id: "cardano", family: "cardano", ticker: "ADA" });
const cosmos = account({ id: "cosmos", family: "cosmos", ticker: "ATOM" });
const sei = account({ id: "sei_evm", family: "evm", ticker: "SEI" });
const solana = account({ id: "solana", family: "solana", ticker: "SOL" });

const tx = (fields: Record<string, unknown>): TransactionLike => fields;
const signed = (op: Record<string, unknown>) =>
  ({ signature: "0xsig", operation: op }) as unknown as SignedOperation;

const attribution = (mainAccount: Account, over: Partial<{ account: AccountLike }> = {}) => ({
  account: over.account ?? mainAccount,
  mainAccount,
  pathway: TransactionPathway.Send,
});

beforeEach(() => setEnv("LEDGER_CLIENT_VERSION", "llc/test"));

describe("buildSignCommonEvent", () => {
  it("derives the action and the delegation target from the transaction", () => {
    const common = buildSignCommonEvent({
      ...attribution(cardano),
      transaction: tx({ family: "cardano", mode: "delegate", poolId: "pool123" }),
    });

    expect(common).toMatchObject({
      appVersion: "llc/test",
      currencyId: "cardano",
      family: "cardano",
      currencyTicker: "ADA",
      earnTransactionType: "delegate",
      rawTransactionType: "delegate",
      validators: ["pool123"],
      dataSource: TransactionDataSource.Sign,
      isSendMax: false,
    });
  });

  it("leaves the action undefined for a non-staking transaction", () => {
    const common = buildSignCommonEvent({
      ...attribution(cardano),
      transaction: tx({ family: "cardano", mode: "send" }),
    });

    expect(common.earnTransactionType).toBeUndefined();
    expect(common.rawTransactionType).toBe("send");
  });

  it("reports the token's own id and ticker for a token account", () => {
    const tokenAccount = {
      type: "TokenAccount",
      token: { id: "ethereum/erc20/usdc", ticker: "USDC" },
    } as unknown as AccountLike;

    const common = buildSignCommonEvent({
      ...attribution(sei, { account: tokenAccount }),
      transaction: tx({ family: "ethereum", mode: "delegate" }),
    });

    expect(common).toMatchObject({ tokenId: "ethereum/erc20/usdc", tokenTicker: "USDC" });
  });

  it("carries send-max through", () => {
    const common = buildSignCommonEvent({
      ...attribution(cosmos),
      transaction: tx({ family: "cosmos", mode: "delegate", useAllAmount: true }),
    });
    expect(common.isSendMax).toBe(true);
  });

  // The stake position exits sign a generic coin framework transaction: a mode, no model.
  describe("for a Solana exit signed with a mode", () => {
    const STAKE_ACCOUNT = "StakeAccountA1111111111111111111111111111111";
    let fetchSpy: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
      clearPendingTxLifecycle("desktop");
      fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    });

    afterEach(() => {
      clearPendingTxLifecycle("desktop");
      fetchSpy.mockRestore();
    });

    const exitOf = (mode: string) =>
      buildSignCommonEvent({
        ...attribution(solana),
        transaction: tx({ family: "solana", mode, recipient: STAKE_ACCOUNT, useAllAmount: true }),
      });

    it.each([
      ["undelegate", "undelegate", "stake.undelegate"],
      ["unstake", "withdraw", "stake.withdraw"],
    ])("should name the %s exit %s", (mode, earnTransactionType, rawTransactionType) => {
      expect(exitOf(mode)).toMatchObject({ earnTransactionType, rawTransactionType });
    });

    it("should report no delegation target, never the stake account", () => {
      expect(exitOf("undelegate").validators).toBeUndefined();
    });

    it("should leave a Solana send out of the funnel", () => {
      expect(exitOf("send").earnTransactionType).toBeUndefined();
    });

    it.each(["undelegate", "unstake"])(
      "should send a native intent then its outcome for the %s exit",
      mode => {
        const common = exitOf(mode);
        const intent = toTxLifecyclePayload(buildTransactionIntentEvent(common), "desktop");
        const outcome = toTxLifecyclePayload(buildTransactionSuccessEvent(common), "desktop");
        expect(intent).toMatchObject({ event: "tx_intent", path: "native", network: "solana" });
        expect(outcome).toMatchObject({ event: "tx_terminal", path: "native", outcome: "success" });

        if (intent) sendTxLifecycle(intent);
        if (outcome) sendTxLifecycle(outcome);

        const sentEvents = fetchSpy.mock.calls.map(
          ([, init]) => (JSON.parse(String(init?.body)) as { event: string }).event,
        );
        expect(sentEvents).toEqual(["tx_intent", "tx_terminal"]);
      },
    );
  });
});

describe("buildTransactionIntentEvent", () => {
  it("marks a sign-stage common event as intent", () => {
    const common = buildSignCommonEvent({
      ...attribution(cardano),
      transaction: tx({ family: "cardano", mode: "delegate" }),
    });

    expect(buildTransactionIntentEvent(common)).toMatchObject({
      status: "intent",
      stage: TransactionStage.Sign,
      earnTransactionType: "delegate",
    });
  });
});

describe("buildBroadcastCommonEvent", () => {
  it("derives the action from the optimistic operation type", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(cosmos),
      signedOperation: signed({ type: "DELEGATE", extra: {} }),
    });

    expect(common).toMatchObject({
      earnTransactionType: "delegate",
      rawTransactionType: "DELEGATE",
      dataSource: TransactionDataSource.Broadcast,
    });
  });

  it("reads the validators cosmos copies into the operation extra", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(cosmos),
      signedOperation: signed({
        type: "DELEGATE",
        extra: { validators: [{ address: "cosmosvaloper1" }] },
      }),
    });

    expect(common.validators).toEqual(["cosmosvaloper1"]);
  });

  it("reports no validators for a family that does not copy them across", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(cardano),
      signedOperation: signed({ type: "DELEGATE", extra: {} }),
    });

    expect(common.validators).toBeUndefined();
  });

  // Both claimReward and compoundReward become REWARD, so transactionRaw is the only way to
  // tell them apart on the generic-coin-framework families.
  it("prefers the exact mode off transactionRaw where it survives", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(sei),
      signedOperation: signed({
        type: "REWARD",
        extra: {},
        transactionRaw: { mode: "compoundReward", valAddress: "0xval" },
      }),
    });

    expect(common).toMatchObject({
      earnTransactionType: "compoundReward",
      rawTransactionType: "compoundReward",
      validators: ["0xval"],
    });
  });

  it("falls back to the operation type when transactionRaw carries no usable mode", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(sei),
      signedOperation: signed({ type: "REWARD", extra: {}, transactionRaw: { mode: "send" } }),
    });

    expect(common).toMatchObject({
      earnTransactionType: "claimReward",
      rawTransactionType: "REWARD",
    });
  });

  it("derives nothing from a plain send, so it never enters the funnel", () => {
    const common = buildBroadcastCommonEvent({
      ...attribution(cosmos),
      signedOperation: signed({ type: "OUT", extra: {} }),
    });

    expect(common.earnTransactionType).toBeUndefined();
  });
});

describe("outcome events", () => {
  const common = buildSignCommonEvent({
    ...attribution(cosmos),
    transaction: tx({ family: "cosmos", mode: "delegate" }),
  });

  it("tags a success as a broadcast-stage success", () => {
    expect(buildTransactionSuccessEvent(common)).toMatchObject({
      status: "success",
      stage: TransactionStage.Broadcast,
      earnTransactionType: "delegate",
    });
  });

  it("classifies a failure and keeps the signed payload for broadcast-stage failures", () => {
    const signedOperation = { signature: "0xsig", rawData: { a: 1 } } as unknown as SignedOperation;
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Broadcast,
      error: Object.assign(new Error("nope"), { name: "NotEnoughBalance" }),
      signedOperation,
    });

    expect(event).toMatchObject({
      status: "failure",
      stage: TransactionStage.Broadcast,
      errorCategory: ErrorCategory.GasInsufficientBalance,
    });
    expect(event.txPayload).toEqual({ signature: "0xsig", rawData: { a: 1 } });
  });

  it("has no signed payload at the sign stage, since signing never completed", () => {
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Sign,
      error: Object.assign(new Error(""), { name: "UserRefusedOnDevice" }),
    });

    expect(event.txPayload).toBeUndefined();
    expect(event.errorCategory).toBe(ErrorCategory.UserDeviceRefused);
  });

  it("unwraps an RPC envelope so the reported name is the real cause", () => {
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Sign,
      error: { isRpcError: true, code: 4001, reason: "User rejected" },
    });

    expect(event.error.name).toBe("UserRejectedRequest");
    expect(event.errorCategory).toBe(ErrorCategory.UserModalDismissed);
  });

  it("coerces a non-Error throwable", () => {
    const event = buildTransactionFailureEvent(common, {
      stage: TransactionStage.Sign,
      error: "just a string",
    });

    expect(event.error.message).toBe("just a string");
    expect(event.errorCategory).toBe(ErrorCategory.Unknown);
  });

  it("reports an abandoned sign prompt as a dismissal", () => {
    expect(buildTransactionAbandonedEvent(common)).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      errorCategory: ErrorCategory.UserModalDismissed,
    });
  });
});
