import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it("returns true for a valid EVM address", async () => {
    const result = await validateAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", {});
    expect(result).toBe(true);
  });

  it("returns false for an invalid address", async () => {
    const result = await validateAddress("some random address", {});
    expect(result).toBe(false);
  });

  it("returns false for an empty string", async () => {
    const result = await validateAddress("", {});
    expect(result).toBe(false);
  });
});
