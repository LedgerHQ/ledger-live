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
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { findOperationDetailsTarget } from "../findOperationDetailsTarget";

const DEPOSIT_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
const account = genAccount("earn-deposit-account", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 3,
});
const tokenAccount = genTokenAccount(0, account, usdcToken);

function withHash(template: Operation, type: OperationType): Operation {
  return {
    ...template,
    id: encodeOperationId(template.accountId, DEPOSIT_HASH, type),
    hash: DEPOSIT_HASH,
    type,
  };
}

function exposeToLiveApp(accountId: string): string {
  setWalletApiIdForAccountId(accountId);
  return getWalletApiIdFromAccountId(accountId);
}

describe("findOperationDetailsTarget", () => {
  it("should return the pending operation and the main account when only a pending operation has the hash", () => {
    const pendingDeposit = withHash(account.operations[0], "OUT");

    const target = findOperationDetailsTarget(
      [{ ...account, pendingOperations: [pendingDeposit] }],
      {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH,
      },
    );

    expect(target).toEqual({
      accountId: account.id,
      parentId: undefined,
      operation: pendingDeposit,
    });
  });

  it("should return the confirmed operation when a confirmed and a pending operation share the hash", () => {
    const confirmedDeposit = withHash(account.operations[0], "FEES");
    const accountWithBoth = {
      ...account,
      operations: [confirmedDeposit, ...account.operations],
      pendingOperations: [withHash(account.operations[0], "OUT")],
    };

    const target = findOperationDetailsTarget([accountWithBoth], {
      walletAccountId: exposeToLiveApp(account.id),
      transactionHash: DEPOSIT_HASH,
    });

    expect(target.operation).toBe(confirmedDeposit);
  });

  it("should return the token operation with the parent id when the account id is a token account's", () => {
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

  it("should throw OperationDetailsOperationNotFound when no operation has the hash", () => {
    expect(() =>
      findOperationDetailsTarget([account], {
        walletAccountId: exposeToLiveApp(account.id),
        transactionHash: DEPOSIT_HASH,
      }),
    ).toThrow(OperationDetailsOperationNotFound);
  });

  it("should throw OperationDetailsAccountNotFound when the account id was never exposed to a live app", () => {
    expect(() =>
      findOperationDetailsTarget([account], {
        walletAccountId: getWalletApiIdFromAccountId("js:2:ethereum:0xNeverExposed:"),
        transactionHash: DEPOSIT_HASH,
      }),
    ).toThrow(OperationDetailsAccountNotFound);
  });
});
