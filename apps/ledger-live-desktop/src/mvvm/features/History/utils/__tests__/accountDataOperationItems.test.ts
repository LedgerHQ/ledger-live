import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { AccountOperationSchema, type AccountOperation } from "@domain/entity-account-operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { toAccountDataOperationItems } from "../accountDataOperationItems";

function assetIdOf(root: Account, account: AccountLike): string {
  return account.type === "TokenAccount" ? account.token.id : root.currency.id;
}

function storedRow(root: Account, account: AccountLike, operation: Operation): AccountOperation {
  return AccountOperationSchema.parse({
    id: `portfolio:${operation.hash}:${operation.type}`,
    hash: operation.hash,
    type: operation.type,
    assetId: assetIdOf(root, account),
    value: operation.value.toFixed(0),
    fee: account.type === "TokenAccount" ? "0" : operation.fee.toFixed(0),
    senders: operation.senders.filter(Boolean),
    recipients: operation.recipients.filter(Boolean),
    blockHeight: operation.blockHeight,
    date: operation.date.toISOString(),
  });
}

function storedRows(account: Account): AccountOperation[] {
  const rows = account.operations.map(operation => storedRow(account, account, operation));
  for (const sub of account.subAccounts ?? []) {
    rows.push(...sub.operations.map(operation => storedRow(account, sub, operation)));
  }
  return rows;
}

describe("toAccountDataOperationItems", () => {
  const ethRoot = genAccount("account-data-operation-items", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 2,
    subAccountsCount: 0,
  });
  const usdcAccount = genTokenAccount(0, ethRoot, usdcToken);
  const account: Account = { ...ethRoot, subAccounts: [usdcAccount] };
  const operations = storedRows(account);

  it("should resolve a parent row and a token row when their ids are not the source ids", () => {
    const items = toAccountDataOperationItems(account, operations, null);
    const visibleOperations = operations.filter(operation => operation.type !== "NONE");

    expect(items).toHaveLength(visibleOperations.length);
    expect(items.every(item => item.type !== "NONE")).toBe(true);
    expect(items.every(item => !item.id.startsWith("portfolio:"))).toBe(true);
    expect(items.some(item => item.account.id === account.id && !item.parentAccount)).toBe(true);
    expect(
      items.some(item => item.account.id === usdcAccount.id && item.parentAccount === account),
    ).toBe(true);
    expect(items.filter(item => item.isPending)).toHaveLength(
      visibleOperations.filter(operation => operation.blockHeight === null).length,
    );
  });

  it("should drop NONE operations the legacy list leaves out", () => {
    const source = account.operations[0];
    const noneOperation = { ...source, id: `${source.id}-none`, type: "NONE" as const };
    const accountWithNone: Account = {
      ...account,
      operations: [...account.operations, noneOperation],
    };
    const page = storedRows(accountWithNone);
    const items = toAccountDataOperationItems(accountWithNone, page, null);

    expect(page.some(operation => operation.type === "NONE")).toBe(true);
    expect(items.some(item => item.type === "NONE")).toBe(false);
    expect(items.some(item => item.operation.id === source.id)).toBe(true);
  });

  it("should drop rows the history filter rejects", () => {
    const items = toAccountDataOperationItems(
      account,
      operations,
      null,
      (_operation, rowAccount) => rowAccount.id !== usdcAccount.id,
    );

    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.account.id === account.id)).toBe(true);
  });
});
