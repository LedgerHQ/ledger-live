import { getNextSequence } from "./getNextSequence";
import type { MultiversXNetworkApi } from "../../network/api";

function makeApi(nonce: number): MultiversXNetworkApi {
  return {
    getAccountNonce: jest.fn().mockResolvedValue(nonce),
  } as unknown as MultiversXNetworkApi;
}

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getNextSequence", () => {
  it("returns nonce as bigint", async () => {
    const api = makeApi(42);
    const nonce = await getNextSequence(api, ADDR);
    expect(nonce).toBe(42n);
  });

  it("returns 0n for new account", async () => {
    const api = makeApi(0);
    const nonce = await getNextSequence(api, ADDR);
    expect(nonce).toBe(0n);
  });

  it("handles large nonces correctly", async () => {
    const api = makeApi(999999);
    const nonce = await getNextSequence(api, ADDR);
    expect(nonce).toBe(999999n);
  });
});
