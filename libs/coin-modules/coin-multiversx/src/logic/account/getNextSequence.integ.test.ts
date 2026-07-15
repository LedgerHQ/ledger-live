/**
 * Integration tests — getNextSequence fetches nonce from the real API.
 */
import { createNetworkApi } from "../../network/api";
import { getNextSequence } from "./getNextSequence";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getNextSequence (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a non-negative bigint nonce", async () => {
    const nonce = await getNextSequence(api, ADDR);
    expect(typeof nonce).toBe("bigint");
    expect(nonce).toBeGreaterThanOrEqual(0n);
  });
});
