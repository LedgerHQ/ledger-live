import { BigNumber } from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { toAccountOperations } from "./operations";

const base = genAccount("operations", { currency: getCryptoCurrencyById("ethereum") });
const tokenAccount = createFixtureTokenAccount("01");
const tokenId = "ethereum/erc20/usd_tether__erc20_";

const op = (
  accountId: string,
  hash: string,
  type: Operation["type"],
  date: string,
  extra: Partial<Operation> = {},
): Operation => ({
  id: `${accountId}-${hash}-${type}`,
  hash,
  type,
  value: new BigNumber(10),
  fee: new BigNumber(1),
  senders: ["0xsender"],
  recipients: ["0xrecipient"],
  blockHeight: 100,
  blockHash: null,
  accountId,
  date: new Date(date),
  extra: {},
  ...extra,
});

const account = (
  operations: Operation[],
  token: Partial<TokenAccount> = {},
  pendingOperations: Operation[] = [],
): Account => ({
  ...base,
  operations,
  pendingOperations,
  subAccounts: [{ ...tokenAccount, ...token }],
});

const ids = (legacy: Account) => toAccountOperations(legacy).operations.map(row => row.id);

describe("toAccountOperations", () => {
  it("maps an operation without its legacy account id, and without a cursor", () => {
    const sent = op(base.id, "0xa", "OUT", "2026-01-02T00:00:00.000Z", { hasFailed: true });
    expect(toAccountOperations(account([sent]))).toEqual({
      operations: [
        {
          id: "ethereum-0xa-OUT",
          hash: "0xa",
          type: "OUT",
          assetId: "ethereum",
          value: "10",
          fee: "1",
          senders: ["0xsender"],
          recipients: ["0xrecipient"],
          blockHeight: 100,
          date: "2026-01-02T00:00:00.000Z",
          hasFailed: true,
        },
      ],
    });
  });

  it("flattens the sub and internal operations after their parent, once", () => {
    const tokenOp = op(tokenAccount.id, "0xa", "OUT", "2026-01-02T00:00:00.000Z");
    const internal = op(base.id, "0xa", "IN", "2026-01-02T00:00:00.000Z", {
      id: `${base.id}-0xa-IN-i0`,
    });
    const parent = op(base.id, "0xa", "FEES", "2026-01-02T00:00:00.000Z", {
      subOperations: [tokenOp],
      internalOperations: [internal],
    });
    const rows = toAccountOperations(account([parent], { operations: [tokenOp] })).operations;
    expect(rows.map(({ id, assetId, parentId }) => ({ id, assetId, parentId }))).toEqual([
      { id: "ethereum-0xa-FEES", assetId: "ethereum", parentId: undefined },
      { id: `${tokenId}-0xa-OUT`, assetId: tokenId, parentId: "ethereum-0xa-FEES" },
      { id: "ethereum-0xa-IN-i0", assetId: "ethereum", parentId: "ethereum-0xa-FEES" },
    ]);
  });

  it("lists the token operations without a parent among the account's, newest first", () => {
    const older = op(base.id, "0xa", "IN", "2026-01-01T00:00:00.000Z");
    const newer = op(base.id, "0xc", "IN", "2026-01-03T00:00:00.000Z");
    const received = op(tokenAccount.id, "0xb", "IN", "2026-01-02T00:00:00.000Z");
    expect(ids(account([newer, older], { operations: [received] }))).toEqual([
      "ethereum-0xc-IN",
      `${tokenId}-0xb-IN`,
      "ethereum-0xa-IN",
    ]);
  });

  it("puts the pending operations first, without a block height, unless already confirmed", () => {
    const confirmed = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z");
    const pending = op(base.id, "0xb", "OUT", "2025-12-31T00:00:00.000Z", { blockHeight: 5 });
    const tokenPending = op(tokenAccount.id, "0xc", "OUT", "2026-01-02T00:00:00.000Z");
    const rows = toAccountOperations(
      account([confirmed], { pendingOperations: [tokenPending] }, [pending, confirmed]),
    ).operations;
    expect(rows.map(({ id, blockHeight }) => ({ id, blockHeight }))).toEqual([
      { id: `${tokenId}-0xc-OUT`, blockHeight: null },
      { id: "ethereum-0xb-OUT", blockHeight: null },
      { id: "ethereum-0xa-OUT", blockHeight: 100 },
    ]);
  });

  it("puts an unconfirmed operation of the confirmed list among the pending ones", () => {
    const confirmed = op(base.id, "0xa", "IN", "2026-01-02T00:00:00.000Z");
    const unconfirmed = op(base.id, "0xb", "IN", "2026-01-01T00:00:00.000Z", { blockHeight: null });
    expect(ids(account([confirmed, unconfirmed]))).toEqual(["ethereum-0xb-IN", "ethereum-0xa-IN"]);
  });

  it("drops a pending operation whose hash is already confirmed under another id", () => {
    const confirmed = op(base.id, "0xa", "FEES", "2026-01-01T00:00:00.000Z");
    const pending = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z");
    expect(ids(account([confirmed], {}, [pending]))).toEqual(["ethereum-0xa-FEES"]);
  });

  it("leaves out an operation with an invalid date instead of failing the read", () => {
    const broken = op(base.id, "0xb", "IN", "2026-01-02T00:00:00.000Z", {
      date: new Date("not a date"),
    });
    const sent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z");
    expect(ids(account([broken, sent]))).toEqual(["ethereum-0xa-OUT"]);
  });

  it("drops a pending sub operation whose hash its token account already confirmed", () => {
    const confirmedToken = op(tokenAccount.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z");
    const pendingToken = op(tokenAccount.id, "0xa", "NONE", "2026-01-01T00:00:00.000Z");
    const parent = op(base.id, "0xa", "FEES", "2026-01-01T00:00:00.000Z", {
      subOperations: [confirmedToken, pendingToken],
    });
    const legacy = account([parent], {
      operations: [confirmedToken],
      pendingOperations: [pendingToken],
    });
    expect(ids(legacy)).toEqual(["ethereum-0xa-FEES", `${tokenId}-0xa-OUT`]);
  });

  it("tells apart the internal operations that share their parent's legacy id", () => {
    const toBob = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", { recipients: ["bob"] });
    const toAlice = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", {
      recipients: ["alice"],
    });
    const parent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", {
      internalOperations: [toBob, toAlice],
    });
    expect(ids(account([parent]))).toEqual([
      "ethereum-0xa-OUT",
      "ethereum-0xa-OUT-i0",
      "ethereum-0xa-OUT-i1",
    ]);
  });

  it.each([
    ["OUT", "IN"],
    ["IN", "OUT"],
  ] as const)(
    "keeps both parents of a %s/%s self-send and their shared internals once",
    (first, second) => {
      const date = "2026-01-01T00:00:00.000Z";
      const internals = [op(base.id, "0xa", "IN", date), op(base.id, "0xa", "NONE", date)];
      const parents = [first, second].map(type =>
        op(base.id, "0xa", type, date, { internalOperations: internals }),
      );
      const rows = toAccountOperations(account(parents)).operations;
      expect(rows.map(({ id, parentId }) => ({ id, parentId }))).toEqual([
        { id: `ethereum-0xa-${first}`, parentId: undefined },
        { id: "ethereum-0xa-IN-i0", parentId: `ethereum-0xa-${first}` },
        { id: "ethereum-0xa-NONE-i1", parentId: `ethereum-0xa-${first}` },
        { id: `ethereum-0xa-${second}`, parentId: undefined },
      ]);
    },
  );

  it("leaves a token transfer filed as an internal operation to its token account", () => {
    const tokenInternal = op(base.id, "0xa", "IN", "2026-01-01T00:00:00.000Z", {
      id: `${base.id}-0xa-IN-i0`,
      extra: { assetReference: "usdt" },
    });
    const parent = op(base.id, "0xa", "FEES", "2026-01-01T00:00:00.000Z", {
      internalOperations: [tokenInternal],
    });
    const received = op(tokenAccount.id, "0xa", "IN", "2026-01-01T00:00:00.000Z");
    expect(ids(account([parent], { operations: [received] }))).toEqual([
      "ethereum-0xa-FEES",
      `${tokenId}-0xa-IN`,
    ]);
  });

  it("keys an operation whose legacy id does not start with its account id by hash and type", () => {
    const sent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", { id: "custom" });
    expect(ids(account([sent]))).toEqual(["ethereum-0xa-OUT"]);
  });

  it("leaves the fee of a token operation to its parent, which pays it in the native coin", () => {
    const received = op(tokenAccount.id, "0xb", "IN", "2026-01-02T00:00:00.000Z");
    const [row] = toAccountOperations(account([], { operations: [received] })).operations;
    expect(row).toEqual(expect.objectContaining({ assetId: tokenId, value: "10", fee: "0" }));
  });

  it("keeps the sub and internal operations after their parent whatever their date", () => {
    const internal = op(base.id, "0xa", "IN", "2026-01-05T00:00:00.000Z", {
      id: `${base.id}-0xa-IN-i0`,
    });
    const parent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", {
      internalOperations: [internal],
    });
    const other = op(base.id, "0xb", "IN", "2026-01-03T00:00:00.000Z");
    expect(ids(account([other, parent]))).toEqual([
      "ethereum-0xb-IN",
      "ethereum-0xa-OUT",
      "ethereum-0xa-IN-i0",
    ]);
  });

  it("leaves out a malformed operation instead of failing the read", () => {
    const broadcasting = op(base.id, "", "OUT", "2026-01-02T00:00:00.000Z");
    const sent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z");
    expect(ids(account([sent], {}, [broadcasting]))).toEqual(["ethereum-0xa-OUT"]);
  });

  it("floors negative amounts at zero and drops empty addresses", () => {
    const sent = op(base.id, "0xa", "OUT", "2026-01-01T00:00:00.000Z", {
      fee: new BigNumber(-1),
      senders: [""],
    });
    const [row] = toAccountOperations(account([sent])).operations;
    expect(row).toEqual(expect.objectContaining({ fee: "0", senders: [] }));
  });
});
