import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { AccountOperationSchema, type AccountOperation } from "@domain/entity-account-operation";
import { MockCursorError } from "../errors";
import { randomAmount, randomBytes, type Random } from "../random";
import type { MockReader } from "../families/types";

/** The newest confirmed operation of every mock account: a fixed date keeps the operations seeded. */
const NEWEST = Date.UTC(2026, 9, 1);
const HOUR = 3_600_000;
const DEFAULT_LIMIT = 20;

type Draft = { assetId: string; type: "IN" | "OUT"; value: bigint; fee: bigint };

const randomInt = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

const hash = (random: Random) =>
  Array.from(randomBytes(random, 32), byte => byte.toString(16).padStart(2, "0")).join("");

const sum = (values: bigint[]) => values.reduce((total, value) => total + value, 0n);

type Size = { outs: number; ins: number };

/** `count` operations when asked (at least one receive), else a few, or tens of each on a busy account. */
function sizeOf(random: Random, busy: boolean, count: number | undefined): Size {
  if (count !== undefined) {
    const ins = Math.max(1, Math.ceil(count / 2));
    return { outs: Math.max(0, count - ins), ins };
  }
  return busy
    ? { outs: randomInt(random, 25, 100), ins: randomInt(random, 25, 100) }
    : { outs: randomInt(random, 0, 5), ins: randomInt(random, 1, 6) };
}

/** The `index`th of `parts` even shares of `total`, the first ones taking the remainder. */
function shareOf(total: number | undefined, parts: number, index: number) {
  if (total === undefined) return undefined;
  const remainder = index < total % parts ? 1 : 0;
  return Math.floor(total / parts) + remainder;
}

/** Some sends, and the receives covering them, their fees and the balance. */
function draftsOf(
  { assetId, balance }: AccountAssetBalance,
  size: Size,
  fee: () => bigint,
  random: Random,
): { ins: Draft[]; outs: Draft[] } {
  const total = BigInt(balance);
  const outs = Array.from({ length: size.outs }, (): Draft => ({
    assetId,
    type: "OUT",
    value: (total * BigInt(randomInt(random, 1, 30))) / 100n,
    fee: fee(),
  }));
  const received = total + sum(outs.map(out => out.value + out.fee));
  const weights = Array.from({ length: size.ins }, () => BigInt(randomInt(random, 1, 100)));
  const totalWeight = sum(weights);
  const shares = weights.slice(1).map(weight => (received * weight) / totalWeight);
  const ins = [received - sum(shares), ...shares].map((value): Draft => ({
    assetId,
    type: "IN",
    value,
    fee: 0n,
  }));
  return { ins, outs };
}

/**
 * The asset's operations oldest first, a send only once received funds cover it and its fee.
 * Once every receive is in, the funds left are the balance plus the sends left, so each one fits.
 */
function fundedOrder({ ins, outs }: { ins: Draft[]; outs: Draft[] }, random: Random): Draft[] {
  const order: Draft[] = [];
  let funds = 0n;
  let nextIn = 0;
  let nextOut = 0;
  while (nextIn < ins.length || nextOut < outs.length) {
    const out = outs.at(nextOut);
    const receive = ins.at(nextIn);
    if (out && out.value + out.fee <= funds && (!receive || random() < 0.5)) {
      order.push(out);
      funds -= out.value + out.fee;
      nextOut++;
    } else if (receive) {
      order.push(receive);
      funds += receive.value;
      nextIn++;
    } else {
      break;
    }
  }
  return order;
}

/** Oldest-first sequences merged newest first, each keeping its order, the next drawn by what it has left. */
function newestFirstOf<T>(sequences: T[][], random: Random): T[] {
  const taken = sequences.map(() => 0);
  const merged: T[] = [];
  for (let left = sequences.flat().length; left > 0; left--) {
    let pick = Math.floor(random() * left);
    const index = sequences.findIndex((sequence, i) => (pick -= sequence.length - taken[i]) < 0);
    merged.push(sequences[index][sequences[index].length - 1 - taken[index]++]);
  }
  return merged;
}

/** `limit` rows after the one the cursor names; the cursor is the id of the previous page's last row. */
function pageOf(rows: AccountOperation[], cursor: string | undefined, limit: number) {
  const start = cursor === undefined ? 0 : rows.findIndex(row => row.id === cursor) + 1;
  if (cursor !== undefined && start === 0)
    throw new MockCursorError(`Unknown mock cursor ${cursor}`);
  const end = start + limit;
  const operations = rows.slice(start, end);
  return end < rows.length ? { operations, nextCursor: rows[end - 1].id } : { operations };
}

/**
 * Operations adding up to the account's balances, `limit` (20 by default) per page: native and
 * token ones, the fees paid in the native coin, the count asked in the tool split across the
 * funded assets, else one account in five busy with a long history; one in ten with its newest
 * operation pending.
 */
export const operations: MockReader<"operations"> = (
  { target: { descriptor, cursor }, currency, family, random, balances, operationCount },
  query,
) => {
  const own = descriptor.type === "address" ? descriptor.address : family.address(currency, random);
  const busy = random() < 0.2;
  const nativeFee = () => randomAmount(random, currency.units[0].magnitude, 0.00001, 0.001);
  const funded = balances().filter(({ balance }) => BigInt(balance) > 0n);
  const drafts = funded.map((row, index) =>
    draftsOf(
      row,
      sizeOf(random, busy, shareOf(operationCount, funded.length, index)),
      row.assetId === currency.id ? nativeFee : () => 0n,
      random,
    ),
  );
  const newestFirst = newestFirstOf(
    drafts.map(asset => fundedOrder(asset, random)),
    random,
  );

  const pending = newestFirst.length > 0 && random() < 0.1;
  let date = NEWEST;
  let blockHeight = randomInt(random, 1_000_000, 20_000_000);
  const rows = newestFirst.map((draft, index): AccountOperation => {
    const isPending = pending && index === 0;
    if (index > (pending ? 1 : 0)) {
      date -= randomInt(random, 1, 240) * HOUR;
      blockHeight -= randomInt(random, 1, 500);
    }
    const counterparty = family.address(currency, random);
    const txHash = hash(random);
    return AccountOperationSchema.parse({
      id: `${draft.assetId}-${txHash}-${draft.type}`,
      hash: txHash,
      type: draft.type,
      assetId: draft.assetId,
      value: draft.value.toString(),
      fee: draft.fee.toString(),
      senders: [draft.type === "IN" ? counterparty : own],
      recipients: [draft.type === "IN" ? own : counterparty],
      blockHeight: isPending ? null : blockHeight,
      date: new Date(isPending ? NEWEST + HOUR : date).toISOString(),
    });
  });
  const requested = query?.limit ?? DEFAULT_LIMIT;
  const limit = Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_LIMIT;
  return pageOf(rows, cursor, limit);
};
