import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { toAccountOperations } from "@ledgerhq/live-common/account-data/full-sync/operations";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { toAccountDataOperationItems } from "../accountDataOperationItems";

describe("toAccountDataOperationItems", () => {
  const ethRoot = genAccount("account-data-operation-items", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 2,
    subAccountsCount: 0,
  });
  const usdcAccount = genTokenAccount(0, ethRoot, usdcToken);
  const account: Account = { ...ethRoot, subAccounts: [usdcAccount] };
  const { operations } = toAccountOperations(account);

  it("resolves a parent row and a token row to table items", () => {
    const items = toAccountDataOperationItems(account, operations, null);
    const visibleOperations = operations.filter(operation => operation.type !== "NONE");

    expect(items).toHaveLength(visibleOperations.length);
    expect(items.every(item => item.type !== "NONE")).toBe(true);
    expect(items.some(item => item.account.id === account.id && !item.parentAccount)).toBe(true);
    expect(
      items.some(item => item.account.id === usdcAccount.id && item.parentAccount === account),
    ).toBe(true);
    expect(items.filter(item => item.isPending)).toHaveLength(
      visibleOperations.filter(operation => operation.blockHeight === null).length,
    );
  });

  it("drops NONE operations the legacy list leaves out", () => {
    const source = account.operations[0];
    const noneOperation = { ...source, id: `${source.id}-none`, type: "NONE" as const };
    const accountWithNone: Account = {
      ...account,
      operations: [...account.operations, noneOperation],
    };
    const page = toAccountOperations(accountWithNone);
    const items = toAccountDataOperationItems(accountWithNone, page.operations, null);

    expect(page.operations.some(operation => operation.type === "NONE")).toBe(true);
    expect(items.some(item => item.type === "NONE")).toBe(false);
    expect(items.some(item => item.operation.id === source.id)).toBe(true);
  });

  it("drops rows the history filter rejects", () => {
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
