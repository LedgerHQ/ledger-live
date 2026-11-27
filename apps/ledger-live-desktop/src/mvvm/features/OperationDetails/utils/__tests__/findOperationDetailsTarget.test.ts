import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  OperationDetailsAccountNotFound,
  OperationDetailsOperationNotFound,
} from "@features/platform-wallet-api-operation-details";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { findOperationDetailsTarget } from "../findOperationDetailsTarget";

const DEPOSIT_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";

function makeAccounts(): { account: Account; tokenAccount: TokenAccount } {
  const account = genAccount("earn-deposit-account", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 3,
  });
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

describe("findOperationDetailsTarget", () => {
  it("should return the confirmed operation and the main account when the hash matches on a main account", () => {
    const { account, tokenAccount } = makeAccounts();
    const deposit = withHash(account.operations[0], "FEES");
    const accountWithDeposit = { ...account, operations: [deposit, ...account.operations] };

    const target = findOperationDetailsTarget([accountWithDeposit, tokenAccount], {
      walletAccountId: exposeToLiveApp(account.id),
      transactionHash: DEPOSIT_HASH,
    });

    expect(target).toEqual({ accountId: account.id, parentId: undefined, operation: deposit });
  });

  it("should return the pending operation when only a pending operation has the hash", () => {
    const { account } = makeAccounts();
    const pendingDeposit = withHash(account.operations[0], "OUT");

    const target = findOperationDetailsTarget(
      [{ ...account, pendingOperations: [pendingDeposit] }],
      {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH,
      },
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

    const target = findOperationDetailsTarget([accountWithBoth], {
      walletAccountId: exposeToLiveApp(account.id),
      transactionHash: DEPOSIT_HASH,
    });

    expect(target.operation).toBe(confirmedDeposit);
  });

  it("should return the first confirmed operation when several confirmed operations share the hash", () => {
    const { account } = makeAccounts();
    const selfSendOut = withHash(account.operations[0], "OUT");
    const selfSendIn = withHash(account.operations[0], "IN");

    const target = findOperationDetailsTarget(
      [{ ...account, operations: [selfSendOut, selfSendIn] }],
      { walletAccountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
    );

    expect(target.operation).toBe(selfSendOut);
  });

  it("should return the token operation with the parent id when the account id is a token account's", () => {
    const { account, tokenAccount } = makeAccounts();
    const tokenDeposit = withHash(tokenAccount.operations[0], "OUT");

    const target = findOperationDetailsTarget(
      [account, { ...tokenAccount, operations: [tokenDeposit] }],
      { walletAccountId: exposeToLiveApp(tokenAccount.id), transactionHash: DEPOSIT_HASH },
    );

    expect(target).toEqual({
      accountId: tokenAccount.id,
      parentId: account.id,
      operation: tokenDeposit,
    });
  });

  it("should throw OperationDetailsOperationNotFound when the hash is only on a token account of the main account", () => {
    const { account, tokenAccount } = makeAccounts();
    const tokenAccountWithDeposit = {
      ...tokenAccount,
      operations: [withHash(tokenAccount.operations[0], "OUT")],
    };

    expect(() =>
      findOperationDetailsTarget(
        [{ ...account, subAccounts: [tokenAccountWithDeposit] }, tokenAccountWithDeposit],
        { walletAccountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      ),
    ).toThrow(OperationDetailsOperationNotFound);
  });

  it("should throw OperationDetailsOperationNotFound when the hash differs only by letter case", () => {
    const { account } = makeAccounts();
    const deposit = withHash(account.operations[0], "FEES");

    expect(() =>
      findOperationDetailsTarget([{ ...account, operations: [deposit] }], {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH.toUpperCase(),
      }),
    ).toThrow(OperationDetailsOperationNotFound);
  });

  it("should throw OperationDetailsOperationNotFound when no operation has the hash", () => {
    const { account } = makeAccounts();

    expect(() =>
      findOperationDetailsTarget([account], {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH,
      }),
    ).toThrow(OperationDetailsOperationNotFound);
  });

  it("should throw OperationDetailsAccountNotFound when the account is not in the list", () => {
    const { account } = makeAccounts();

    expect(() =>
      findOperationDetailsTarget([], {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH,
      }),
    ).toThrow(OperationDetailsAccountNotFound);
  });

  it("should throw OperationDetailsAccountNotFound when the account id was never exposed to a live app", () => {
    const { account } = makeAccounts();

    expect(() =>
      findOperationDetailsTarget([account], {
        walletAccountId: getWalletApiIdFromAccountId("js:2:ethereum:0xNeverExposed:"),
        transactionHash: DEPOSIT_HASH,
      }),
    ).toThrow(OperationDetailsAccountNotFound);
  });
});
