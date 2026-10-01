import { isPoolAddress, isValidNumCycles, MAX_NUM_CYCLES, MIN_NUM_CYCLES } from "./staking";

// Real, checksum-valid mainnet address (also used, unmocked, by buildUnsignedTx.test.ts fixtures).
const ADDRESS = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

describe("isPoolAddress", () => {
  it("accepts a valid address followed by a contract name", () => {
    expect(isPoolAddress(`${ADDRESS}.native-pool-signer-manager`)).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["a bare address", ADDRESS],
    ["an empty contract name", `${ADDRESS}.`],
    ["a contract name starting with a digit", `${ADDRESS}.1pool`],
    ["a contract name with a dot", `${ADDRESS}.pool.x`],
    ["an invalid address", "SP1not-an-address.pool"],
  ])("rejects %s", (_, value) => {
    expect(isPoolAddress(value)).toBe(false);
  });
});

describe("isValidNumCycles", () => {
  it.each([MIN_NUM_CYCLES, 12, MAX_NUM_CYCLES])("accepts %s", value => {
    expect(isValidNumCycles(value)).toBe(true);
  });

  it.each([undefined, 0, MAX_NUM_CYCLES + 1, 1.5, NaN])("rejects %s", value => {
    expect(isValidNumCycles(value)).toBe(false);
  });
});
