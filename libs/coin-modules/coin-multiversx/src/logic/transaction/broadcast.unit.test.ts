import { broadcast } from "./broadcast";
import type { MultiversXNetworkApi } from "../../network/api";

function makeApi(txHash: string | null = "deadbeefcafe"): MultiversXNetworkApi {
  return {
    submit: jest.fn().mockResolvedValue(txHash),
  } as unknown as MultiversXNetworkApi;
}

const SIGNED_TX = JSON.stringify({
  nonce: 1,
  value: "1000",
  receiver: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
  sender: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
  gasPrice: 1000000000,
  gasLimit: 50000,
  chainID: "1",
  version: 2,
  options: 1,
  signature: "aabbcc",
});

describe("broadcast", () => {
  it("returns txHash on success", async () => {
    const api = makeApi("deadbeefcafe");
    const hash = await broadcast(api, SIGNED_TX);
    expect(hash).toBe("deadbeefcafe");
  });

  it("throws when txHash is empty string", async () => {
    const api = makeApi("");
    await expect(broadcast(api, SIGNED_TX)).rejects.toThrow("broadcast failed");
  });

  it("throws when txHash is null", async () => {
    const api = makeApi(null);
    await expect(broadcast(api, SIGNED_TX)).rejects.toThrow("broadcast failed");
  });
});
