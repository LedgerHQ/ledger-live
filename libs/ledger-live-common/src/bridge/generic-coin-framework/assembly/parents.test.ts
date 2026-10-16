import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  buildSubOperationIndex,
  type SubOperationIndex,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { OperationCommon } from "../types";
import {
  buildParentOperations,
  getFeePayer,
  getTokenContract,
  isFeesOnlyNativeOp,
  isInternalLiveOp,
  isNativeLiveOp,
  parentOpsForTxWithNonInternalOperations,
  parentOpsForTxWithOnlyInternalOperations,
  parentOpsFromNativeOps,
  relinkSubOperations,
  syntheticParentForTokenOnlyTx,
} from "./parents";

const ACCOUNT_ID = "js:2:evm:0xme:";
const ME = "0xMe";
const date = new Date("2026-01-01T00:00:00.000Z");

const op = (fields: Partial<OperationCommon> = {}): OperationCommon =>
  ({
    id: "op",
    hash: "0xtx",
    accountId: ACCOUNT_ID,
    type: "OUT",
    value: new BigNumber(5),
    fee: new BigNumber(1),
    senders: [ME.toLowerCase()],
    recipients: ["0xother"],
    blockHash: "0xblock",
    blockHeight: 10,
    date,
    extra: {},
    ...fields,
  }) as OperationCommon;

const tokenAccount = (operations: OperationCommon[]): TokenAccount =>
  ({ operations, pendingOperations: [] }) as unknown as TokenAccount;

const NO_SUB_OPERATIONS: SubOperationIndex = new Map();

describe("operation predicates", () => {
  it("tells internal, native, token contract, fee payer and fees-only operations", () => {
    expect(isInternalLiveOp(op({ extra: { internal: true } }))).toBe(true);
    expect(isInternalLiveOp(op())).toBe(false);

    expect(isNativeLiveOp(op())).toBe(true);
    expect(isNativeLiveOp(op({ extra: { assetReference: "", assetOwner: "" } }))).toBe(true);
    expect(isNativeLiveOp(op({ extra: { assetReference: "0xt" } }))).toBe(false);
    expect(isNativeLiveOp(op({ extra: { assetOwner: ME } }))).toBe(false);

    expect(getTokenContract(op({ extra: { assetReference: "0xt" } }))).toBe("0xt");
    expect(getTokenContract(op({ extra: { assetReference: "" } }))).toBeUndefined();

    expect(getFeePayer(op({ extra: { feePayer: ME } }))).toBe(ME);
    expect(getFeePayer(op({ extra: { feePayer: "" } }))).toBeUndefined();

    expect(isFeesOnlyNativeOp(op({ value: new BigNumber(1) }))).toBe(true);
    expect(isFeesOnlyNativeOp(op())).toBe(false);
    expect(isFeesOnlyNativeOp(op({ type: "IN", value: new BigNumber(1) }))).toBe(false);
  });
});

describe("buildParentOperations", () => {
  it("passes a native operation through, its sub-operations and internal operations attached", () => {
    const tokenOp = op({ id: "token", extra: { assetReference: "0xt", assetOwner: ME } });
    const internal = op({ id: "internal", extra: { internal: true } });
    const [parent] = buildParentOperations(
      buildSubOperationIndex([tokenAccount([tokenOp])]),
      [op({ extra: { assetAmount: "5", ledgerOpType: "OUT", kept: 1 } }), tokenOp],
      [internal],
      ACCOUNT_ID,
      ME,
    );

    expect(parent).toMatchObject({
      id: "op",
      type: "OUT",
      subOperations: [tokenOp],
      internalOperations: [internal],
      // The token keys of `extra` are the sub-operations'.
      extra: { kept: 1 },
    });
  });

  it("emits a native send of nothing but its fee as FEES", () => {
    const [parent] = buildParentOperations(
      NO_SUB_OPERATIONS,
      [op({ value: new BigNumber(1), transactionSequenceNumber: new BigNumber(3) })],
      [],
      ACCOUNT_ID,
      ME,
    );

    expect(parent).toMatchObject({
      id: encodeOperationId(ACCOUNT_ID, "0xtx", "FEES"),
      type: "FEES",
      value: new BigNumber(1),
      fee: new BigNumber(1),
      transactionSequenceNumber: new BigNumber(3),
    });
  });

  it("gives a token-only transaction a FEES parent when the account paid a fee, NONE otherwise", () => {
    const tokenOp = (fields: Partial<OperationCommon>) =>
      op({ ...fields, extra: { assetReference: "0xt", assetOwner: ME, ...fields.extra } });

    const [paid] = buildParentOperations(
      NO_SUB_OPERATIONS,
      [tokenOp({ extra: { feePayer: ME.toLowerCase() } })],
      [],
      ACCOUNT_ID,
      ME,
    );
    expect(paid).toMatchObject({ type: "FEES", value: new BigNumber(1), recipients: ["0xt"] });

    const [zeroFee] = buildParentOperations(
      NO_SUB_OPERATIONS,
      [tokenOp({ fee: new BigNumber(0), extra: { feePayer: ME } })],
      [],
      ACCOUNT_ID,
      ME,
    );
    expect(zeroFee).toMatchObject({ type: "NONE", value: new BigNumber(0) });

    const [thirdParty] = buildParentOperations(
      NO_SUB_OPERATIONS,
      [tokenOp({ extra: { feePayer: "0xsponsor" } })],
      [],
      ACCOUNT_ID,
      ME,
    );
    expect(thirdParty).toMatchObject({ type: "NONE", senders: [ME.toLowerCase()] });

    const ownerOnly = op({
      senders: undefined,
      recipients: undefined,
      extra: { assetOwner: ME },
    } as unknown as Partial<OperationCommon>);
    const [noContract] = buildParentOperations(NO_SUB_OPERATIONS, [ownerOnly], [], ACCOUNT_ID, ME);
    expect(noContract).toMatchObject({ type: "NONE", senders: [], recipients: [] });
  });

  it("emits two parents for a self-send and one NONE parent for an internal-only transaction", () => {
    const internal = op({
      hash: "0xinternal",
      senders: ["0xcontract"],
      extra: { internal: true, feePayer: "0xcaller" },
    });
    const parents = buildParentOperations(
      NO_SUB_OPERATIONS,
      [op({ id: "out" }), op({ id: "in", type: "IN" })],
      [internal],
      ACCOUNT_ID,
      ME,
    );

    expect(parents.map(parent => [parent.hash, parent.type])).toEqual([
      ["0xtx", "OUT"],
      ["0xtx", "IN"],
      ["0xinternal", "NONE"],
    ]);
    expect(parents[2]).toMatchObject({
      value: new BigNumber(0),
      senders: ["0xcaller"],
      recipients: ["0xcontract"],
      internalOperations: [internal],
    });

    const [unknownCaller] = buildParentOperations(
      NO_SUB_OPERATIONS,
      [],
      [op({ hash: "0xi", extra: { internal: true } })],
      ACCOUNT_ID,
      ME,
    );
    expect(unknownCaller.senders).toEqual([]);
  });

  it("builds each kind of parent on its own", () => {
    const native = op();
    expect(parentOpsFromNativeOps([native], ACCOUNT_ID, [], [])).toEqual([
      { ...native, subOperations: [], internalOperations: [] },
    ]);
    expect(
      syntheticParentForTokenOnlyTx(
        op({ extra: { assetReference: "0xt" } }),
        ACCOUNT_ID,
        ME,
        [],
        [],
      ),
    ).toMatchObject({ type: "NONE", recipients: ["0xt"] });
    expect(
      parentOpsForTxWithNonInternalOperations(
        "0xtx",
        [native],
        [],
        NO_SUB_OPERATIONS,
        ACCOUNT_ID,
        ME,
      ),
    ).toHaveLength(1);
  });

  it("emits no parent for no internal operation", () => {
    expect(
      parentOpsForTxWithOnlyInternalOperations("0xtx", [], NO_SUB_OPERATIONS, ACCOUNT_ID),
    ).toEqual([]);
  });
});

describe("relinkSubOperations", () => {
  const tokenRow = op({ id: "token", extra: { assetReference: "0xt", assetOwner: ME } });

  it("points a parent at the token rows indexed for its hash", () => {
    const stale = op({ subOperations: [op({ id: "evicted" })] });
    const [relinked] = relinkSubOperations([stale], new Map([["0xtx", [tokenRow]]]));

    expect(relinked).toEqual({ ...stale, subOperations: [tokenRow] });
  });

  it("returns a parent whose links already match as it is", () => {
    const linked = op({ subOperations: [tokenRow] });
    const bare = op({ hash: "0xbare" });
    const index = new Map([["0xtx", [tokenRow]]]);

    const [same, unlinked] = relinkSubOperations([linked, bare], index);
    expect(same).toBe(linked);
    expect(unlinked).toBe(bare);
  });

  it("follows a row replaced under the same id, by reference", () => {
    const updated = { ...tokenRow };
    const [relinked] = relinkSubOperations(
      [op({ subOperations: [tokenRow] })],
      new Map([["0xtx", [updated]]]),
    );

    expect(relinked.subOperations?.[0]).toBe(updated);
  });
});
