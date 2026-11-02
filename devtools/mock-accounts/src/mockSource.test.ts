import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountOperation, AccountOperationsPage } from "@domain/entity-account-operation";
import { MockCursorError } from "./errors";
import { mockDescriptors } from "./generate";
import { mockSource } from "./mockSource";
import { setOperationCount } from "./operationCounts";

const readBalance = (descriptor: AccountDescriptor) => {
  const read = mockSource.read?.balance;
  if (!read) throw new Error("no balance reader");
  return read({ accountUUID: computeAccountUUID(descriptor), descriptor }, undefined);
};

const readOperations = (descriptor: AccountDescriptor, cursor?: string, limit?: number) => {
  const read = mockSource.read?.operations;
  if (!read) throw new Error("no operations reader");
  return read(
    { accountUUID: computeAccountUUID(descriptor), descriptor, cursor },
    limit === undefined ? undefined : { limit },
  );
};

/** Every page of the account, following each `nextCursor`. */
async function pagesOf(descriptor: AccountDescriptor, limit?: number) {
  const pages: AccountOperationsPage[] = [];
  let cursor: string | undefined;
  do {
    const page = await readOperations(descriptor, cursor, limit);
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return pages;
}

const ALL = 10_000;

const allOperationsOf = async (descriptor: AccountDescriptor) =>
  (await readOperations(descriptor, undefined, ALL)).operations;

/** What the operations of each asset add up to: received, minus sent and the fees paid. */
const netOf = (operations: AccountOperation[]) => {
  const net = new Map<string, bigint>();
  const add = (assetId: string, amount: bigint) =>
    net.set(assetId, (net.get(assetId) ?? 0n) + amount);
  for (const op of operations) {
    add(op.assetId, op.type === "IN" ? BigInt(op.value) : -BigInt(op.value));
    if (op.type === "OUT") add(op.assetId, -BigInt(op.fee));
  }
  return net;
};

/** Many accounts, to see each family's spread. */
const balancesOf = (network: string) =>
  Promise.all(mockDescriptors(network, 40, []).map(readBalance));

describe("mockSource", () => {
  it("serves the mock purpose only", () => {
    expect(mockSource.purposes).toEqual(["mock"]);
  });

  it("answers the same balance for the same account", async () => {
    const [account] = mockDescriptors("ethereum", 1, []);
    expect(await readBalance(account)).toEqual(await readBalance(account));
  });

  it("answers bitcoin balances in the native coin only, up to 2 BTC, all spendable, some empty", async () => {
    const balances = await balancesOf("bitcoin");
    for (const rows of balances) {
      expect(rows).toHaveLength(1);
      expect(rows[0].assetId).toBe("bitcoin");
      expect(rows[0].spendableBalance).toBe(rows[0].balance);
      expect(BigInt(rows[0].balance)).toBeLessThanOrEqual(200_000_000n);
    }
    expect(balances.some(([row]) => row.balance === "0")).toBe(true);
    expect(new Set(balances.map(([row]) => row.balance)).size).toBeGreaterThan(20);
  });

  it("answers ethereum balances with the coin first, then some tokens", async () => {
    const balances = await balancesOf("ethereum");
    for (const rows of balances) {
      expect(rows[0].assetId).toBe("ethereum");
      expect(BigInt(rows[0].balance)).toBeLessThanOrEqual(5n * 10n ** 18n);
    }
    const tokens = new Set(balances.flatMap(rows => rows.slice(1).map(row => row.assetId)));
    expect(tokens).toEqual(
      new Set(["ethereum/erc20/usd__coin", "ethereum/erc20/usd_tether__erc20_"]),
    );
  });

  it("answers the generic balance on a family without its own mock", async () => {
    const [account] = mockDescriptors("solana", 1, []);
    const rows = await readBalance(account);
    expect(rows).toEqual([expect.objectContaining({ assetId: "solana" })]);
  });

  it("answers the same operations page for the same account and cursor", async () => {
    const [account] = mockDescriptors("ethereum", 1, []);
    expect(await readOperations(account)).toEqual(await readOperations(account));
  });

  it.each(["bitcoin", "ethereum", "solana"])(
    "answers %s operations adding up to the balance, pending then newest first",
    async network => {
      for (const account of mockDescriptors(network, 20, [])) {
        const [balances, operations] = await Promise.all([
          readBalance(account),
          allOperationsOf(account),
        ]);
        const net = netOf(operations);
        for (const row of balances) expect(net.get(row.assetId) ?? 0n).toBe(BigInt(row.balance));
        const ordered = [...operations].sort(
          (a, b) =>
            Number(b.blockHeight === null) - Number(a.blockHeight === null) ||
            b.date.localeCompare(a.date),
        );
        expect(operations).toEqual(ordered);
      }
    },
  );

  it("pages 20 operations by default, some accounts over several pages", async () => {
    const counts = [];
    for (const account of mockDescriptors("ethereum", 40, [])) {
      const pages = await pagesOf(account);
      for (const page of pages.slice(0, -1)) expect(page.operations).toHaveLength(20);
      counts.push(pages.flatMap(page => page.operations).length);
    }
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(50);
    expect(counts.filter(count => count > 40).length).toBeGreaterThan(1);
  });

  it.each([1, 7, 50])(
    "walks every operation once in pages of %i, the last without a cursor",
    async limit => {
      for (const account of mockDescriptors("ethereum", 10, [])) {
        const pages = await pagesOf(account, limit);
        for (const page of pages.slice(0, -1)) {
          expect(page.operations).toHaveLength(limit);
          expect(page.nextCursor).toBeDefined();
        }
        expect(pages[pages.length - 1].nextCursor).toBeUndefined();
        const walked = pages.flatMap(page => page.operations);
        expect(walked).toEqual(await allOperationsOf(account));
        expect(new Set(walked.map(op => op.id)).size).toBe(walked.length);
      }
    },
  );

  it("generates the operation count asked in the tool, split across the funded assets, still adding up to the balance", async () => {
    const accounts = mockDescriptors("ethereum", 10, mockDescriptors("ethereum", 100, []));
    setOperationCount(
      accounts.map(account => computeAccountUUID(account)),
      250,
    );
    for (const account of accounts) {
      const balances = await readBalance(account);
      const funded = balances.filter(({ balance }) => BigInt(balance) > 0n);
      const operations = await allOperationsOf(account);
      expect(operations).toHaveLength(funded.length === 0 ? 0 : 250);
      expect(netOf(operations)).toEqual(
        new Map(funded.map(({ assetId, balance }) => [assetId, BigInt(balance)])),
      );
    }
  });

  it("goes back to the seeded operations once the count asked is cleared", async () => {
    const [account] = mockDescriptors("ethereum", 1, mockDescriptors("ethereum", 200, []));
    const seeded = await allOperationsOf(account);
    setOperationCount([computeAccountUUID(account)], 250);
    setOperationCount([computeAccountUUID(account)], undefined);
    expect(await allOperationsOf(account)).toEqual(seeded);
  });

  it.each(["bitcoin", "ethereum", "solana"])(
    "never spends on %s more than was received before, oldest first",
    async network => {
      for (const account of mockDescriptors(network, 40, [])) {
        const funds = new Map<string, bigint>();
        const newestFirst = await allOperationsOf(account);
        for (let index = newestFirst.length - 1; index >= 0; index--) {
          const op = newestFirst[index];
          const delta = op.type === "IN" ? BigInt(op.value) : -BigInt(op.value) - BigInt(op.fee);
          funds.set(op.assetId, (funds.get(op.assetId) ?? 0n) + delta);
          expect(funds.get(op.assetId)).toBeGreaterThanOrEqual(0n);
        }
      }
    },
  );

  it("rejects a cursor it never handed out", async () => {
    const [account] = mockDescriptors("ethereum", 1, []);
    await expect(readOperations(account, "not-a-cursor")).rejects.toThrow(MockCursorError);
  });

  it("answers ethereum operations from and to the account's address, some pending, token ones without a fee", async () => {
    const operations = [];
    for (const account of mockDescriptors("ethereum", 40, [])) {
      const own = await allOperationsOf(account);
      for (const op of own) {
        expect(op.type === "IN" ? op.recipients : op.senders).toEqual([
          account.type === "address" ? account.address : "",
        ]);
      }
      operations.push(...own);
    }
    expect(operations.some(op => op.blockHeight === null)).toBe(true);
    const tokens = operations.filter(op => op.assetId !== "ethereum");
    expect(tokens.length).toBeGreaterThan(0);
    for (const op of tokens) expect(op.fee).toBe("0");
  });
});
