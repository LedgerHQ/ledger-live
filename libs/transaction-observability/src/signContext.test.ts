import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { setEnv } from "@shared/env";
import { hasSignContext, recallSignContext, rememberSignContext } from "./signContext";
import { buildBroadcastCommonEvent } from "./eventBuilders";
import { TransactionDataSource, TransactionPathway } from "./logEvent";

const account = (id: string, family: string, ticker: string) =>
  ({ id: "acc", type: "Account", currency: { id, family, ticker } }) as unknown as Account;

const signed = (op: Record<string, unknown>) =>
  ({ signature: "0xsig", operation: op }) as unknown as SignedOperation;

const attribution = (mainAccount: Account) => ({
  account: mainAccount,
  mainAccount,
  pathway: TransactionPathway.Send,
});

beforeEach(() => setEnv("LEDGER_CLIENT_VERSION", "llc/test"));

describe("rememberSignContext / recallSignContext", () => {
  it("carries the exact action and the delegation target across the stages", () => {
    const signedOperation = signed({ type: "DELEGATE", extra: {} });
    rememberSignContext(signedOperation, "solana", {
      family: "solana",
      model: { kind: "stake.createAccount", uiState: { voteAccAddr: "voteAcc" } },
    });

    expect(recallSignContext(signedOperation)).toEqual({
      earnTransactionType: "delegate",
      rawTransactionType: "stake.createAccount",
      validators: ["voteAcc"],
      isSendMax: false,
    });
  });

  it("does not correlate a different signed operation", () => {
    rememberSignContext(signed({ type: "DELEGATE" }), "cosmos", {
      family: "cosmos",
      mode: "delegate",
    });

    expect(recallSignContext(signed({ type: "DELEGATE" }))).toBeUndefined();
    expect(recallSignContext(undefined)).toBeUndefined();
  });

  it("stores nothing for a non-staking transaction", () => {
    const signedOperation = signed({ type: "OUT" });
    rememberSignContext(signedOperation, "cosmos", { family: "cosmos", mode: "send" });

    expect(hasSignContext(signedOperation)).toBe(false);
    expect(recallSignContext(signedOperation)).toBeUndefined();
  });

  it("survives a read, so a rebroadcast still correlates", () => {
    const signedOperation = signed({ type: "DELEGATE" });
    rememberSignContext(signedOperation, "cosmos", { family: "cosmos", mode: "delegate" });

    recallSignContext(signedOperation);
    expect(hasSignContext(signedOperation)).toBe(true);
  });
});

describe("buildBroadcastCommonEvent with a sign context", () => {
  // Solana's stake.withdraw becomes an `IN` operation, indistinguishable from an incoming
  // transfer — correlation is the only thing that makes it reportable at all.
  it("recovers an action the operation type cannot express", () => {
    const solana = account("solana", "solana", "SOL");
    const signedOperation = signed({ type: "IN", extra: {} });
    rememberSignContext(signedOperation, "solana", {
      family: "solana",
      model: { kind: "stake.withdraw" },
    });

    expect(buildBroadcastCommonEvent({ ...attribution(solana), signedOperation })).toMatchObject({
      earnTransactionType: "withdraw",
      rawTransactionType: "stake.withdraw",
      dataSource: TransactionDataSource.Sign,
    });
  });

  it("recovers the validator for a family that drops it from the operation", () => {
    const cardano = account("cardano", "cardano", "ADA");
    const signedOperation = signed({ type: "DELEGATE", extra: {} });
    rememberSignContext(signedOperation, "cardano", {
      family: "cardano",
      mode: "delegate",
      poolId: "pool123",
    });

    expect(
      buildBroadcastCommonEvent({ ...attribution(cardano), signedOperation }).validators,
    ).toEqual(["pool123"]);
  });

  // The sign stage has no broadcastConfig, so it must never win on attribution.
  it("keeps the broadcast stage's route attribution", () => {
    const cosmos = account("cosmos", "cosmos", "ATOM");
    const signedOperation = signed({ type: "DELEGATE", extra: {} });
    rememberSignContext(signedOperation, "cosmos", { family: "cosmos", mode: "delegate" });

    const common = buildBroadcastCommonEvent({
      account: cosmos,
      mainAccount: cosmos,
      pathway: TransactionPathway.Dapp,
      manifestId: "kiln",
      signedOperation,
    });

    expect(common).toMatchObject({ pathway: TransactionPathway.Dapp, manifestId: "kiln" });
  });

  // Celo and tron only expose the target on the optimistic operation, so a correlation hit
  // must not discard it just because the sign stage had none.
  it("keeps an operation-only validator when the sign stage had none", () => {
    const celo = account("celo", "celo", "CELO");
    const signedOperation = signed({ type: "VOTE", extra: { celoSourceValidator: "0xgroup" } });
    rememberSignContext(signedOperation, "celo", { family: "celo", mode: "vote" });

    const common = buildBroadcastCommonEvent({ ...attribution(celo), signedOperation });
    expect(common).toMatchObject({
      earnTransactionType: "delegate",
      dataSource: TransactionDataSource.Sign,
      validators: ["0xgroup"],
    });
  });

  it("falls back to the operation type when nothing correlates", () => {
    const cosmos = account("cosmos", "cosmos", "ATOM");

    expect(
      buildBroadcastCommonEvent({
        ...attribution(cosmos),
        signedOperation: signed({ type: "DELEGATE", extra: {} }),
      }),
    ).toMatchObject({
      earnTransactionType: "delegate",
      rawTransactionType: "DELEGATE",
      dataSource: TransactionDataSource.Broadcast,
    });
  });

  it("falls back when the sign stage saw no staking action", () => {
    const cosmos = account("cosmos", "cosmos", "ATOM");
    const signedOperation = signed({ type: "DELEGATE", extra: {} });
    rememberSignContext(signedOperation, "cosmos", { family: "cosmos", mode: "send" });

    expect(buildBroadcastCommonEvent({ ...attribution(cosmos), signedOperation })).toMatchObject({
      dataSource: TransactionDataSource.Broadcast,
    });
  });
});
