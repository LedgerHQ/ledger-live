import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { toAccountOperations } from "./toAccountOperations";

const erc20 = (id: string, ticker: string): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`ethereum/erc20/${id}`),
  contractAddress: `0x${ticker}`,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
  tokenType: "erc20",
  name: ticker,
  ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: ticker, code: ticker, magnitude: 6 }],
});

const tokensData = [erc20("usd__coin", "USDC"), erc20("makerdao", "MKR")];
const tokenIds = tokensData.map(each => each.id);

const account = genAccount("operations", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 3,
  subAccountsCount: 2,
  tokensData,
  tokenIds,
});

const [parent] = account.operations;
const internal = { ...parent, id: "same-id", type: "IN" as const };

describe("toAccountOperations", () => {
  it("answers what the sync holds, newest first, without a next page nor a total", () => {
    const page = toAccountOperations(account);
    const dates = page.operations.map(operation => Date.parse(operation.date));
    expect(page.nextCursor).toBeUndefined();
    expect(page.total).toBeUndefined();
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(page.operations.length).toBeGreaterThanOrEqual(account.operations.length);
  });

  it("keeps two internal transfers of one transaction apart, even under one bridge id", () => {
    const page = toAccountOperations({
      ...account,
      operations: [{ ...parent, internalOperations: [internal, internal] }],
    });
    const internals = page.operations.filter(each => each.parentOperationId === parent.id);
    expect(internals.map(each => each.id)).toEqual([
      `${parent.hash}-internal-0`,
      `${parent.hash}-internal-1`,
    ]);
  });

  it("keeps one copy of the internal transfers two parents of a transaction reference", () => {
    const out = { ...parent, id: "out", type: "OUT" as const, internalOperations: [internal] };
    const into = { ...parent, id: "in", type: "IN" as const, internalOperations: [internal] };
    const page = toAccountOperations({ ...account, operations: [out, into] });
    expect(page.operations.filter(each => each.id === `${parent.hash}-internal-0`)).toHaveLength(1);
  });

  it("leaves out an operation the entity rejects, keeping the others", () => {
    const [, kept] = account.operations;
    const page = toAccountOperations({
      ...account,
      subAccounts: [],
      operations: [
        { ...parent, hash: "" },
        { ...parent, id: "bad-date", date: new Date("x") },
        kept,
      ],
    });
    expect(page.operations.map(each => each.id)).toEqual([kept.id]);
  });

  it("keeps a token transfer once, under its parent, when the token account lists it too", () => {
    const [tokenAccount] = account.subAccounts ?? [];
    const transfer = { ...parent, id: "token-transfer", accountId: tokenAccount.id };
    const page = toAccountOperations({
      ...account,
      operations: [{ ...parent, subOperations: [transfer] }],
      subAccounts: [{ ...tokenAccount, operations: [transfer] }],
    });
    expect(page.operations.filter(each => each.id === transfer.id)).toEqual([
      expect.objectContaining({ assetId: tokenAccount.token.id, parentOperationId: parent.id }),
    ]);
  });
});
