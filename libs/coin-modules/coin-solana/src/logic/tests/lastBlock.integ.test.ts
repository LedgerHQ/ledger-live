import { getChainAPI } from "../../network";
import { lastBlock } from "../lastBlock";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

describe("lastBlock (integration)", () => {
  it("returns last block info from mainnet", async () => {
    const result = await lastBlock(api);

    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
