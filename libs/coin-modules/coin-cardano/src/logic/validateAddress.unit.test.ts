import { validateAddress } from "./validateAddress";

const MAINNET_BASE =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";

describe("validateAddress", () => {
  it("accepts a valid mainnet address", async () => {
    await expect(validateAddress(MAINNET_BASE, {})).resolves.toBe(true);
  });

  it("rejects a non-address string", async () => {
    await expect(validateAddress("not-an-address", {})).resolves.toBe(false);
  });

  it("rejects an empty string", async () => {
    await expect(validateAddress("", {})).resolves.toBe(false);
  });
});
