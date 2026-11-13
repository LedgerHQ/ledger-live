import { getChainAPI } from "../../network";
import { chainConfigFrom } from "../../utils";
import { lastBlock } from "../lastBlock";
import { solanaDefaults } from "../../config";

const api = getChainAPI(chainConfigFrom(solanaDefaults.solana));

describe("lastBlock (integration)", () => {
  it("returns last block info from mainnet", async () => {
    const result = await lastBlock(api);

    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
