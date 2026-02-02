import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it("should return true for valid Aleo addresses", async () => {
    const validAddresses = [
      "aleo1np929uzmkhkcdu4hsuf8qm9ec8ydfrz5hqd80dy9tw3d2e7f5vrq9554s9",
      "aleo177n83pjn4m995e60z6njza7xg3wankzfwu3rutqtj05usmtza5yqw8gryy",
      "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f",
    ];

    for (const address of validAddresses) {
      expect(await validateAddress(address, {})).toBe(true);
    }
  });

  it("should return false for addresses with incorrect length", async () => {
    const invalidLengthAddresses = [
      "aleo1",
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc1",
      "",
    ];

    for (const address of invalidLengthAddresses) {
      expect(await validateAddress(address, {})).toBe(false);
    }
  });

  it("should return false for addresses with incorrect prefix", async () => {
    const invalidPrefixAddresses = [
      "btc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
      "eth1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
      "aleo0qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    ];

    for (const address of invalidPrefixAddresses) {
      expect(await validateAddress(address, {})).toBe(false);
    }
  });

  it("should return false for invalid bech32m format", async () => {
    const invalidBech32Addresses = [
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqb3ljyzc",
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqi3ljyzc",
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo3ljyzc",
    ];

    for (const address of invalidBech32Addresses) {
      expect(await validateAddress(address, {})).toBe(false);
    }
  });

  it("should return false for null or undefined", async () => {
    expect(await validateAddress(null as any, {})).toBe(false);
    expect(await validateAddress(undefined as any, {})).toBe(false);
  });

  it("should return false for empty string", async () => {
    expect(await validateAddress("", {})).toBe(false);
  });

  it("should return false for random strings", async () => {
    const randomStrings = [
      "this is not an aleo address at all and should fail validation",
      "1234567890123456789012345678901234567890123456789012345678901",
      "ALEO1QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ3LJYZC",
    ];

    for (const str of randomStrings) {
      expect(await validateAddress(str, {})).toBe(false);
    }
  });
});
