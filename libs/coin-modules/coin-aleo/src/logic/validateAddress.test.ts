import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it.each([
    "aleo1np929uzmkhkcdu4hsuf8qm9ec8ydfrz5hqd80dy9tw3d2e7f5vrq9554s9",
    "aleo177n83pjn4m995e60z6njza7xg3wankzfwu3rutqtj05usmtza5yqw8gryy",
    "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f",
  ])("should return true for valid Aleo address: %s", async address => {
    expect(await validateAddress(address, {})).toBe(true);
  });

  it.each([
    "aleo1",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc1",
    "",
  ])("should return false for address with incorrect length: %s", async address => {
    expect(await validateAddress(address, {})).toBe(false);
  });

  it.each([
    "btc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "eth1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo0qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
  ])("should return false for address with incorrect prefix: %s", async address => {
    expect(await validateAddress(address, {})).toBe(false);
  });

  it.each([
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqb3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqi3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo3ljyzc",
  ])("should return false for invalid bech32m format: %s", async address => {
    expect(await validateAddress(address, {})).toBe(false);
  });

  it("should return false for null or undefined", async () => {
    // @ts-expect-error - testing invalid input
    expect(await validateAddress(null, {})).toBe(false);
    // @ts-expect-error - testing invalid input
    expect(await validateAddress(undefined, {})).toBe(false);
  });

  it("should return false for empty string", async () => {
    expect(await validateAddress("", {})).toBe(false);
  });

  it.each([
    "this is not an aleo address at all and should fail validation",
    "1234567890123456789012345678901234567890123456789012345678901",
    "ALEO1QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ3LJYZC",
  ])("should return false for random string: %s", async str => {
    expect(await validateAddress(str, {})).toBe(false);
  });
});
