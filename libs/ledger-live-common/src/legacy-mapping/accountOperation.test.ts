import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { AccountOperationSchema } from "@domain/entity-account-operations";
import {
  assetIdsOf,
  flattenOperation,
  toAccountOperation,
  toAccountOperations,
} from "./accountOperation";

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const TOKEN_ACCOUNT_ID = `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;

const operation = (over: Partial<Operation> = {}): Operation =>
  ({
    id: "op-1",
    hash: "0xdead",
    accountId: ACCOUNT_ID,
    type: "OUT",
    value: new BigNumber("1000"),
    fee: new BigNumber("21"),
    senders: ["0xabc"],
    recipients: ["0xdef"],
    blockHeight: 19_000_000,
    date: new Date("2026-01-31T12:00:00.000Z"),
    extra: {},
    ...over,
  }) as unknown as Operation;

/** Denominations for the fixture account: ETH on the main account, USDC on the token account. */
const assetIdOf = (accountId: string) =>
  accountId === TOKEN_ACCOUNT_ID ? "ethereum/erc20/usd__coin" : "ethereum";

describe("toAccountOperation", () => {
  it("projects the fields the entity models, and nothing else", () => {
    expect(toAccountOperation(operation(), "ethereum")).toEqual({
      id: "op-1",
      accountId: ACCOUNT_ID,
      assetId: "ethereum",
      hash: "0xdead",
      type: "OUT",
      value: "1000",
      fee: "21",
      senders: ["0xabc"],
      recipients: ["0xdef"],
      blockHeight: 19_000_000,
      date: "2026-01-31T12:00:00.000Z",
    });
  });

  it("produces a row that satisfies the entity schema", () => {
    expect(() =>
      AccountOperationSchema.parse(toAccountOperation(operation(), "ethereum")),
    ).not.toThrow();
  });

  it("keeps a pending operation, with no block height", () => {
    expect(toAccountOperation(operation({ blockHeight: null }), "ethereum").blockHeight).toBeNull();
    expect(
      toAccountOperation(operation({ blockHeight: undefined }), "ethereum").blockHeight,
    ).toBeNull();
  });

  it("carries hasFailed only when the legacy operation set it", () => {
    expect(toAccountOperation(operation(), "ethereum").hasFailed).toBeUndefined();
    expect(toAccountOperation(operation({ hasFailed: true }), "ethereum").hasFailed).toBe(true);
  });

  it("rejects an amount that is not a whole smallest-unit value", () => {
    expect(() =>
      toAccountOperation(operation({ value: new BigNumber("-1") }), "ethereum"),
    ).toThrow();
    expect(() =>
      toAccountOperation(operation({ value: new BigNumber("1.5") }), "ethereum"),
    ).toThrow();
  });
});

describe("flattenOperation", () => {
  it("lifts sub and internal operations to sibling rows that name their parent", () => {
    const rows = flattenOperation(
      operation({
        subOperations: [operation({ id: "sub-1", accountId: TOKEN_ACCOUNT_ID })],
        internalOperations: [operation({ id: "int-1" })],
      }),
      assetIdOf,
    );

    expect(rows.map(r => r.id)).toEqual(["op-1", "sub-1", "int-1"]);
    expect(rows[0].parentOperationId).toBeUndefined();
    expect(rows[1]).toMatchObject({ accountId: TOKEN_ACCOUNT_ID, parentOperationId: "op-1" });
    expect(rows[2]).toMatchObject({ accountId: ACCOUNT_ID, parentOperationId: "op-1" });
  });

  it("drops nftOperations — this entity does not model them", () => {
    const rows = flattenOperation(
      operation({ nftOperations: [operation({ id: "nft-1" })] }),
      assetIdOf,
    );
    expect(rows.map(r => r.id)).toEqual(["op-1"]);
  });
});

describe("toAccountOperations", () => {
  const account = (over: Partial<Account> = {}): Account =>
    ({
      id: ACCOUNT_ID,
      currency: { id: "ethereum" },
      operations: [operation()],
      subAccounts: [],
      ...over,
    }) as unknown as Account;

  it("walks the account's own history", () => {
    expect(toAccountOperations(account()).map(r => r.id)).toEqual(["op-1"]);
  });

  it("walks the token accounts' histories too", () => {
    const rows = toAccountOperations(
      account({
        subAccounts: [
          {
            id: TOKEN_ACCOUNT_ID,
            token: { id: "ethereum/erc20/usd__coin" },
            operations: [operation({ id: "tok-1", accountId: TOKEN_ACCOUNT_ID })],
          },
        ] as never,
      }),
    );
    expect(rows.map(r => r.id)).toEqual(["op-1", "tok-1"]);
    expect(rows[1].accountId).toBe(TOKEN_ACCOUNT_ID);
  });

  it("does not duplicate a token transfer that appears in both places", () => {
    // The same transfer is nested under the parent's operation *and* listed on the token account.
    const transfer = operation({ id: "sub-1", accountId: TOKEN_ACCOUNT_ID });
    const rows = toAccountOperations(
      account({
        operations: [operation({ subOperations: [transfer] })],
        subAccounts: [
          {
            id: TOKEN_ACCOUNT_ID,
            token: { id: "ethereum/erc20/usd__coin" },
            operations: [transfer],
          },
        ] as never,
      }),
    );

    expect(rows.map(r => r.id)).toEqual(["op-1", "sub-1"]);
    // The nested copy wins: it is the one that knows which transaction it came out of.
    expect(rows[1].parentOperationId).toBe("op-1");
  });

  it("handles an account with no token accounts", () => {
    expect(toAccountOperations(account({ subAccounts: undefined }))).toHaveLength(1);
  });
});
