/**
 * Integration tests — hit real MultiversX API.
 */
import { createNetworkApi } from "../../network/api";
import { lastBlock } from "./lastBlock";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

describe("lastBlock (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a block with positive height", async () => {
    const block = await lastBlock(api);
    expect(block.height).toBeGreaterThan(0);
    expect(block.hash.length).toBeGreaterThan(0);
    expect(block.time).toBeInstanceOf(Date);
  });
});
