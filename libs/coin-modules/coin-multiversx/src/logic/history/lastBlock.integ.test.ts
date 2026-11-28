import { API_ENDPOINT, DELEGATION_API_ENDPOINT } from "../../test/integEndpoints";
/**
 * Integration tests — hit real MultiversX API.
 */
import { createNetworkApi } from "../../network/api";
import { lastBlock } from "./lastBlock";

describe("lastBlock (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a block with positive height", async () => {
    const block = await lastBlock(api);
    expect(block.height).toBeGreaterThan(0);
    expect(block.hash.length).toBeGreaterThan(0);
    expect(block.time).toBeInstanceOf(Date);
  });
});
