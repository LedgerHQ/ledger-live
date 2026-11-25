import { addPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/pending";
import { setEnv } from "@ledgerhq/live-env";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createMockCantonAccount } from "../test/fixtures";
import type { CantonAccount } from "../types";
import { postSync } from "./postSync";
import { nextPendingSequenceNumber } from "./signOperation";

const RETENTION_MS = 30 * 60 * 1000;

const operation = (hash: string, overrides: Partial<Operation> = {}): Operation => ({
  id: `op-${hash}`,
  hash,
  accountId: "canton-account",
  type: "OUT",
  value: new BigNumber(100),
  fee: new BigNumber(5),
  blockHash: null,
  blockHeight: null,
  senders: ["party123"],
  recipients: ["bob"],
  date: new Date(),
  extra: {},
  ...overrides,
});

const subAccount = (overrides: Partial<TokenAccount>): TokenAccount =>
  ({
    type: "TokenAccount",
    id: "canton-account+token",
    parentId: "canton-account",
    operations: [],
    pendingOperations: [],
    ...overrides,
  }) as TokenAccount;

const account = (overrides: Partial<CantonAccount>): CantonAccount => ({
  ...createMockCantonAccount(),
  id: "canton-account",
  operations: [],
  pendingOperations: [],
  subAccounts: [],
  ...overrides,
});

describe("postSync", () => {
  beforeAll(() => setEnv("OPERATION_OPTIMISTIC_RETENTION", RETENTION_MS));

  it("removes a pending operation whose transaction is synced, keeping the others", () => {
    const synced = account({
      operations: [
        operation("sent", { blockHeight: 10, transactionSequenceNumber: BigNumber(10) }),
      ],
      pendingOperations: [
        operation("sent", { transactionSequenceNumber: BigNumber(Date.now()) }),
        operation("not-yet", { transactionSequenceNumber: BigNumber(Date.now() + 1) }),
      ],
    });

    expect(postSync(synced, synced).pendingOperations.map(op => op.hash)).toEqual(["not-yet"]);
  });

  it("removes a pending operation whose transaction is synced on a sub-account", () => {
    const synced = account({
      pendingOperations: [operation("token-send")],
      subAccounts: [subAccount({ operations: [operation("token-send")] })],
    });

    expect(postSync(synced, synced).pendingOperations).toEqual([]);
  });

  it("removes the sub-accounts' pending operations past the retention, and those synced", () => {
    const expired = operation("expired", { date: new Date(Date.now() - RETENTION_MS - 1) });
    const synced = account({
      subAccounts: [
        subAccount({
          operations: [operation("synced")],
          pendingOperations: [expired, operation("synced"), operation("recent")],
        }),
      ],
    });

    expect(postSync(synced, synced).subAccounts?.[0].pendingOperations.map(op => op.hash)).toEqual([
      "recent",
    ]);
  });
});

const send = (base: Account, hash: string) =>
  addPendingOperation(
    base,
    operation(hash, { transactionSequenceNumber: nextPendingSequenceNumber(base) }),
  );

describe("nextPendingSequenceNumber", () => {
  afterEach(() => jest.useRealTimers());

  it("keeps the earlier pending operation of two sends in the same millisecond", () => {
    jest.useFakeTimers({ now: 1_000 });

    const afterSecond = send(send(account({}), "first"), "second");

    expect(afterSecond.pendingOperations.map(op => op.hash)).toEqual(["second", "first"]);
  });

  it("stays above every pending operation after the clock moves back", () => {
    jest.useFakeTimers({ now: 1_000 });
    const base = account({
      pendingOperations: [operation("first", { transactionSequenceNumber: BigNumber(5_000) })],
    });

    expect(nextPendingSequenceNumber(base)).toEqual(BigNumber(5_001));
  });
});
