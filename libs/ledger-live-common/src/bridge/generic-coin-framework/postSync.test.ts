import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { getEnvDefault, setEnv } from "@shared/env";
import { postSync } from "./postSync";
import BigNumber from "bignumber.js";

const SENDER = "0xsender";

function op(
  hash: string,
  sequence: number | undefined,
  type: OperationType,
  date: Date = new Date(),
): Operation {
  return {
    hash,
    type,
    date,
    senders: [SENDER],
    transactionSequenceNumber: sequence === undefined ? undefined : new BigNumber(sequence),
  } as Operation;
}

// postSync only reads operations and pending pools, so sub accounts stay partial too
type AccountShape = Partial<Omit<Account, "subAccounts">> & {
  subAccounts?: Partial<TokenAccount>[];
};

const account = (shape: AccountShape) => shape as Account;

describe("postSync", () => {
  afterEach(() => {
    setEnv("OPERATION_OPTIMISTIC_RETENTION", getEnvDefault("OPERATION_OPTIMISTIC_RETENTION"));
  });

  it("removes confirmed and outdated native operations from the pending pool", () => {
    const initialAccount = account({
      operations: [op("hash0", 4, "OUT")],
      pendingOperations: [op("outdated", 3, "IN"), op("hash1", 5, "OUT"), op("hash2", 6, "IN")],
    });
    const synced = account({
      operations: [op("hash1", 5, "OUT"), op("hash0", 4, "OUT")],
      pendingOperations: [op("outdated", 3, "IN"), op("hash1", 5, "OUT"), op("hash2", 6, "IN")],
    });

    expect(postSync(initialAccount, synced)).toMatchObject({
      operations: [
        { hash: "hash1", transactionSequenceNumber: new BigNumber(5), type: "OUT" },
        { hash: "hash0", transactionSequenceNumber: new BigNumber(4), type: "OUT" },
      ],
      pendingOperations: [
        { hash: "hash2", transactionSequenceNumber: new BigNumber(6), type: "IN" },
      ],
    });
  });

  it("removes confirmed and outdated token operations from the pending pool", () => {
    const initialAccount = account({
      operations: [op("hash0", 4, "OUT")],
      pendingOperations: [op("outdated", 3, "NONE"), op("hash1", 5, "FEES"), op("hash2", 6, "IN")],
      subAccounts: [
        {
          pendingOperations: [op("outdated", 3, "IN"), op("hash1", 5, "FEES")],
        },
      ],
    });
    const synced = account({
      operations: [op("hash1", 5, "FEES"), op("hash0", 4, "OUT")],
      pendingOperations: [op("outdated", 3, "NONE"), op("hash1", 5, "FEES"), op("hash2", 6, "IN")],
      subAccounts: [
        {
          operations: [op("hash1", 5, "OUT")],
          pendingOperations: [op("outdated", 3, "IN")],
        },
      ],
    });

    expect(postSync(initialAccount, synced)).toMatchObject({
      operations: [
        { hash: "hash1", transactionSequenceNumber: new BigNumber(5), type: "FEES" },
        { hash: "hash0", transactionSequenceNumber: new BigNumber(4), type: "OUT" },
      ],
      pendingOperations: [
        { hash: "hash2", transactionSequenceNumber: new BigNumber(6), type: "IN" },
      ],
      subAccounts: [
        {
          operations: [
            {
              hash: "hash1",
              transactionSequenceNumber: new BigNumber(5),
              type: "OUT",
            },
          ],
          pendingOperations: [],
        },
      ],
    });
  });

  it("removes a superseded token operation once the replacement confirms with the same nonce", () => {
    // the replacement reuses the nonce but has a different hash, so only the nonce can release it
    const initialAccount = account({
      operations: [op("hash0", 4, "OUT")],
      pendingOperations: [op("superseded", 5, "FEES")],
      subAccounts: [{ operations: [], pendingOperations: [op("superseded", 5, "OUT")] }],
    });
    const synced = account({
      operations: [op("replacement", 5, "FEES"), op("hash0", 4, "OUT")],
      pendingOperations: [op("superseded", 5, "FEES")],
      subAccounts: [{ operations: [], pendingOperations: [op("superseded", 5, "OUT")] }],
    });

    const result = postSync(initialAccount, synced);
    expect(result.pendingOperations).toEqual([]);
    expect(result.subAccounts?.[0].pendingOperations).toEqual([]);
  });

  it("keeps a pending token operation whose nonce is still ahead of the confirmed ones", () => {
    const shape = {
      operations: [op("hash0", 4, "OUT")],
      pendingOperations: [op("pending", 5, "FEES")],
      subAccounts: [{ operations: [], pendingOperations: [op("pending", 5, "OUT")] }],
    };

    const result = postSync(account(shape), account(shape));
    expect(result.pendingOperations).toMatchObject([{ hash: "pending" }]);
    expect(result.subAccounts?.[0].pendingOperations).toMatchObject([{ hash: "pending" }]);
  });

  it("removes pending operations that have been optimistic for longer than the retention window", () => {
    setEnv("OPERATION_OPTIMISTIC_RETENTION", 1000);
    const stale = new Date(Date.now() - 60_000);
    const shape = {
      operations: [],
      pendingOperations: [op("stale", 5, "FEES", stale)],
      subAccounts: [{ operations: [], pendingOperations: [op("stale", 5, "OUT", stale)] }],
    };

    const result = postSync(account(shape), account(shape));
    expect(result.pendingOperations).toEqual([]);
    expect(result.subAccounts?.[0].pendingOperations).toEqual([]);
  });

  it("uses a confirmed nonce of 0 as the comparison baseline", () => {
    const initialAccount = account({
      operations: [op("hash0", 0, "OUT")],
      pendingOperations: [op("pending", 0, "OUT")],
    });
    const synced = account({
      operations: [op("noSequence", undefined, "OUT"), op("hash0", 0, "OUT")],
      pendingOperations: [op("pending", 0, "OUT")],
    });

    expect(postSync(initialAccount, synced).pendingOperations).toEqual([]);
  });
});
