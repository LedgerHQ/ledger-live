import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { usdcToken } from "../modularDrawer/__mocks__/currencies.mock";
import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "./converters";
import { resolveOperationDetailsTarget } from "./resolveOperationDetailsTarget";

const ethereum = getCryptoCurrencyById("ethereum");
const DEPOSIT_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
const INVALID_PARAMS_MESSAGE = "Invalid params for custom.openOperationDetails";

function makeAccounts(): { account: Account; tokenAccount: TokenAccount } {
  const account = genAccount("earn-deposit-account", { currency: ethereum, operationsSize: 3 });
  const tokenAccount = genTokenAccount(0, account, usdcToken);
  return { account: { ...account, subAccounts: [tokenAccount] }, tokenAccount };
}

function withHash(template: Operation, type: OperationType, hash = DEPOSIT_HASH): Operation {
  return { ...template, id: encodeOperationId(template.accountId, hash, type), hash, type };
}

function exposeToLiveApp(accountId: string): string {
  setWalletApiIdForAccountId(accountId);
  return getWalletApiIdFromAccountId(accountId);
}

describe("resolveOperationDetailsTarget", () => {
  it("should return the confirmed operation and the main account when the hash matches on a main account", () => {
    const { account, tokenAccount } = makeAccounts();
    const deposit = withHash(account.operations[0], "FEES");
    const accountWithDeposit = { ...account, operations: [deposit, ...account.operations] };

    const target = resolveOperationDetailsTarget(
      { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      [accountWithDeposit, tokenAccount],
    );

    expect(target).toEqual({ accountId: account.id, parentId: undefined, operation: deposit });
  });

  it("should return the pending operation when only a pending operation has the hash", () => {
    const { account } = makeAccounts();
    const pendingDeposit = withHash(account.operations[0], "OUT");
    const accountWithPending = { ...account, pendingOperations: [pendingDeposit] };

    const target = resolveOperationDetailsTarget(
      { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      [accountWithPending],
    );

    expect(target.operation).toBe(pendingDeposit);
  });

  it("should return the confirmed operation when a confirmed and a pending operation share the hash", () => {
    const { account } = makeAccounts();
    const confirmedDeposit = withHash(account.operations[0], "FEES");
    const pendingDeposit = withHash(account.operations[0], "OUT");
    const accountWithBoth = {
      ...account,
      operations: [confirmedDeposit, ...account.operations],
      pendingOperations: [pendingDeposit],
    };

    const target = resolveOperationDetailsTarget(
      { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      [accountWithBoth],
    );

    expect(target.operation).toBe(confirmedDeposit);
  });

  it("should return the first confirmed operation when several confirmed operations share the hash", () => {
    const { account } = makeAccounts();
    const selfSendOut = withHash(account.operations[0], "OUT");
    const selfSendIn = withHash(account.operations[0], "IN");
    const accountWithSelfSend = { ...account, operations: [selfSendOut, selfSendIn] };

    const target = resolveOperationDetailsTarget(
      { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      [accountWithSelfSend],
    );

    expect(target.operation).toBe(selfSendOut);
  });

  it("should return the token operation with the parent id when the account id is a token account's", () => {
    const { account, tokenAccount } = makeAccounts();
    const tokenDeposit = withHash(tokenAccount.operations[0], "OUT");
    const tokenAccountWithDeposit = { ...tokenAccount, operations: [tokenDeposit] };

    const target = resolveOperationDetailsTarget(
      { accountId: exposeToLiveApp(tokenAccount.id), transactionHash: DEPOSIT_HASH },
      [account, tokenAccountWithDeposit],
    );

    expect(target).toEqual({
      accountId: tokenAccount.id,
      parentId: account.id,
      operation: tokenDeposit,
    });
  });

  it("should throw when the hash exists only on a token account of the given main account", () => {
    const { account, tokenAccount } = makeAccounts();
    const tokenDeposit = withHash(tokenAccount.operations[0], "OUT");
    const tokenAccountWithDeposit = { ...tokenAccount, operations: [tokenDeposit] };

    expect(() =>
      resolveOperationDetailsTarget(
        { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
        [{ ...account, subAccounts: [tokenAccountWithDeposit] }, tokenAccountWithDeposit],
      ),
    ).toThrow("Operation not found");
  });

  it("should throw when the hash differs only by letter case", () => {
    const { account } = makeAccounts();
    const deposit = withHash(account.operations[0], "FEES");

    expect(() =>
      resolveOperationDetailsTarget(
        { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH.toUpperCase() },
        [{ ...account, operations: [deposit] }],
      ),
    ).toThrow("Operation not found");
  });

  it("should throw when no operation has the hash", () => {
    const { account } = makeAccounts();

    expect(() =>
      resolveOperationDetailsTarget(
        { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
        [account],
      ),
    ).toThrow("Operation not found");
  });

  it("should throw when the account id is known but the account is not in the list", () => {
    const { account } = makeAccounts();

    expect(() =>
      resolveOperationDetailsTarget(
        { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
        [],
      ),
    ).toThrow("Account not found");
  });

  it("should throw when the account id was never exposed to a live app", () => {
    const { account } = makeAccounts();
    const neverExposedId = getWalletApiIdFromAccountId("js:2:ethereum:0xNeverExposed:");

    expect(() =>
      resolveOperationDetailsTarget({ accountId: neverExposedId, transactionHash: DEPOSIT_HASH }, [
        account,
      ]),
    ).toThrow("Invalid accountId");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", DEPOSIT_HASH],
    ["an array", [DEPOSIT_HASH]],
  ])("should throw a TypeError when the params are %s", (_label, params) => {
    const { account } = makeAccounts();

    expect(() => resolveOperationDetailsTarget(params, [account])).toThrow(TypeError);
    expect(() => resolveOperationDetailsTarget(params, [account])).toThrow(INVALID_PARAMS_MESSAGE);
  });

  it.each([
    ["missing", { transactionHash: DEPOSIT_HASH }],
    ["empty", { accountId: "", transactionHash: DEPOSIT_HASH }],
    ["not a string", { accountId: 42, transactionHash: DEPOSIT_HASH }],
  ])("should throw a TypeError when the accountId is %s", (_label, params) => {
    const { account } = makeAccounts();

    expect(() => resolveOperationDetailsTarget(params, [account])).toThrow(TypeError);
  });

  it.each([
    ["missing", {}],
    ["empty", { transactionHash: "" }],
    ["not a string", { transactionHash: 42 }],
  ])("should throw a TypeError when the transactionHash is %s", (_label, hashParams) => {
    const { account } = makeAccounts();
    const params = { accountId: exposeToLiveApp(account.id), ...hashParams };

    expect(() => resolveOperationDetailsTarget(params, [account])).toThrow(TypeError);
  });
});
