import { isValidZcashAddress, validateAddress } from "./validateAddress";
import {
  T1_MAINNET,
  T2_ADDRESS,
  T3_MAINNET,
  TM_ADDRESS,
  UTEST_ORCHARD,
  UTEST_SAPLING_ONLY,
  UTEST_TRANSPARENT_ONLY,
  U_ORCHARD_MAINNET,
} from "../test/testnetAddresses";

describe("logic/validateAddress", () => {
  it("accepts a valid transparent t1 address", () => {
    expect(isValidZcashAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F")).toBe(true);
  });

  it("rejects an empty address", () => {
    expect(isValidZcashAddress("")).toBe(false);
  });

  it("rejects a malformed address", () => {
    expect(isValidZcashAddress("not-an-address")).toBe(false);
  });

  it("rejects a t-address whose checksum does not hold", () => {
    // The valid address above with its last character changed: only Base58Check
    // catches this, the ZIP-316 classifier reads the prefix alone.
    expect(isValidZcashAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7G")).toBe(false);
  });

  it("rejects a Sapling zs1 address (unsupported)", () => {
    expect(
      isValidZcashAddress(
        "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly",
      ),
    ).toBe(false);
  });

  it("validateAddress delegates to isValidZcashAddress", async () => {
    await expect(
      validateAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", { currencyId: "zcash", networkId: 1 }),
    ).resolves.toBe(true);
    await expect(validateAddress("invalid")).resolves.toBe(false);
  });
});

describe("logic/validateAddress — per network", () => {
  const corrupt = (address: string) => address.slice(0, -1) + (address.endsWith("a") ? "b" : "a");

  it.each([TM_ADDRESS, T2_ADDRESS, UTEST_ORCHARD, UTEST_TRANSPARENT_ONLY])(
    "accepts the testnet address %s for zcash_testnet",
    address => {
      expect(isValidZcashAddress(address, "zcash_testnet")).toBe(true);
    },
  );

  it("rejects a mistyped tm address (bad checksum)", () => {
    expect(isValidZcashAddress(corrupt(TM_ADDRESS), "zcash_testnet")).toBe(false);
    expect(isValidZcashAddress(corrupt(T2_ADDRESS), "zcash_testnet")).toBe(false);
  });

  it("rejects a utest UA with only a Sapling receiver", () => {
    expect(isValidZcashAddress(UTEST_SAPLING_ONLY, "zcash_testnet")).toBe(false);
  });

  it.each([T1_MAINNET, T3_MAINNET, U_ORCHARD_MAINNET])(
    "rejects the mainnet address %s for zcash_testnet",
    address => {
      expect(isValidZcashAddress(address, "zcash_testnet")).toBe(false);
    },
  );

  it.each([TM_ADDRESS, T2_ADDRESS, UTEST_ORCHARD])(
    "rejects the testnet address %s for zcash",
    address => {
      expect(isValidZcashAddress(address)).toBe(false);
      expect(isValidZcashAddress(address, "zcash")).toBe(false);
    },
  );

  it("keeps zcash_regtest on the mainnet encodings", () => {
    expect(isValidZcashAddress(T1_MAINNET, "zcash_regtest")).toBe(true);
    expect(isValidZcashAddress(TM_ADDRESS, "zcash_regtest")).toBe(false);
  });

  it("validateAddress honours parameters.currencyId", async () => {
    await expect(validateAddress(TM_ADDRESS, { currencyId: "zcash_testnet" })).resolves.toBe(true);
    await expect(validateAddress(TM_ADDRESS, { currencyId: "zcash" })).resolves.toBe(false);
    await expect(validateAddress(TM_ADDRESS)).resolves.toBe(false);
    await expect(validateAddress(T1_MAINNET, { currencyId: "zcash_testnet" })).resolves.toBe(false);
  });
});
