import { mapTxToOps } from "../bridge/bridgeHelpers/account";
import { fetchTxns } from "../network/api";
import { getBalance } from "./getBalance";
import { getBlockInfo } from "./getBlockInfo";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";

// A mainnet account with a short, settled history: transactions 25132406, 25132352, 25132338 and
// 5432782, newest first.
const ADDRESS = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const HISTORY = [25132406, 25132352, 25132338, 5432782];
// Anyone can send to the account, so each walk starts just above its known history.
const ABOVE_HISTORY = String(HISTORY[0] + 1);

describe("lastBlock", () => {
  it("returns the tip with a hash, a recent time and its parent", async () => {
    const tip = await lastBlock();

    expect(tip.height).toBeGreaterThan(0);
    expect(tip.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(Date.now() - tip.time.getTime()).toBeLessThan(10 * 60 * 1000);
    expect(tip.parent?.height).toBe(tip.height - 1);
  });

  it("chains to the block below it", async () => {
    const tip = await lastBlock();
    const parent = await getBlockInfo(tip.height - 1);

    expect(tip.parent?.hash).toBe(parent.hash);
  });
});

describe("getBlockInfo", () => {
  it("reads an archived block", async () => {
    expect(await getBlockInfo(25132352)).toEqual({
      height: 25132352,
      hash: "140ba81ec6f5b51f7833b0af174cb580b5faa2e5a5efaa90c5527c6f3e30c802",
      time: new Date(1750760223449),
      parent: {
        height: 25132351,
        hash: "b79c073eec74aec15d75b88bae8a1d240ea6c3d2dbe36d608cbaf6e13c723163",
      },
    });
  });

  it("reads the genesis block", async () => {
    const genesis = await getBlockInfo(0);

    expect(genesis.hash).toBe("ffca0ecf5e837541c7ee5be431e433ad8e972a7f371e86fbe4f8ad646c7cbcea");
    expect(genesis.parent).toBeUndefined();
  });

  it("throws above the tip", async () => {
    const tip = await lastBlock();

    await expect(getBlockInfo(tip.height + 1_000_000)).rejects.toThrow(/No block at height/);
  });
});

describe("getBalance", () => {
  it("returns one native balance", async () => {
    const balances = await getBalance(ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBeGreaterThanOrEqual(0n);
  });
});

describe("listOperations", () => {
  it("walks the whole history in pages, newest first", async () => {
    const first = await listOperations(ADDRESS, { minHeight: 0, limit: 2, cursor: ABOVE_HISTORY });
    expect(first.items.map(op => op.tx.block.height)).toEqual(HISTORY.slice(0, 2));
    expect(first.next).toBe(String(HISTORY[1]));

    const second = await listOperations(ADDRESS, { minHeight: 0, limit: 2, cursor: first.next });
    expect(second.items.map(op => op.tx.block.height)).toEqual(HISTORY.slice(2));
    expect(second.next).toBeUndefined();
  });

  it("stops at minHeight", async () => {
    const page = await listOperations(ADDRESS, { minHeight: HISTORY[2], cursor: ABOVE_HISTORY });

    expect(page.items.map(op => op.tx.block.height)).toEqual(HISTORY.slice(0, 3));
    expect(page.next).toBeUndefined();
  });

  it("reports the hashes and dates the account bridge reports", async () => {
    const { items } = await listOperations(ADDRESS, { minHeight: 0, cursor: ABOVE_HISTORY });
    const legacy = (await fetchTxns(ADDRESS, BigInt(ABOVE_HISTORY))).flatMap(
      mapTxToOps("accountId", ADDRESS),
    );

    expect(items.map(op => [op.type, op.tx.hash, op.tx.date])).toEqual(
      legacy.map(op => [op.type, op.hash, op.date]),
    );
  });
});
