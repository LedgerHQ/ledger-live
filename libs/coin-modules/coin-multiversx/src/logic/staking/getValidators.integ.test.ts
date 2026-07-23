/**
 * Integration tests — getValidators fetches the provider list from the real
 * delegation API.
 */
import { createNetworkApi } from "../../network/api";
import { getValidators } from "./getValidators";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

describe("getValidators (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a page of validators from the live providers endpoint", async () => {
    const result = await getValidators(api);

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    const validator = result.items[0];
    expect(typeof validator.address).toBe("string");
    expect(validator.address.length).toBeGreaterThan(0);
    expect(typeof validator.commissionRate).toBe("string");
  });
});
