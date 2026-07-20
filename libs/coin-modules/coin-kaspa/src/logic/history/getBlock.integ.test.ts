import { getBlock } from "./getBlock";

const MINTED_BLOCK = 480818084;

describe("getBlock (integration)", () => {
  it("fetches the full block (metadata + transactions) at a known blue score", async () => {
    const block = await getBlock(MINTED_BLOCK);

    // info half mirrors getBlockInfo
    expect(block.info.height).toBe(MINTED_BLOCK);
    expect(typeof block.info.hash).toBe("string");
    expect(block.info.hash.length).toBeGreaterThanOrEqual(64);
    expect(block.info.time).toBeInstanceOf(Date);

    // transactions half — every Kaspa block has at least the coinbase transaction
    expect(Array.isArray(block.transactions)).toBe(true);
    expect(block.transactions.length).toBeGreaterThan(0);

    const tx = block.transactions[0];
    expect(typeof tx.hash).toBe("string");
    expect(tx.failed).toBe(false);
    expect(Array.isArray(tx.operations)).toBe(true);
    // coinbase pays the miner -> at least one resolved transfer output
    expect(tx.operations.length).toBeGreaterThan(0);
    expect(tx.operations[0].type).toBe("transfer");
  });
});
