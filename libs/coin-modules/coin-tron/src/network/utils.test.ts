import BigNumber from "bignumber.js";
import { abiDecodeTrc20Transfer, abiEncodeTrc20Transfer } from "./utils";

describe("abiEncodeTrc20Transfer", () => {
  it("encodes large TRC20 amount without precision loss (uint256 beyond 2^53)", () => {
    const amount = new BigNumber("1000000000000000000000000000");
    const address = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const encoded = abiEncodeTrc20Transfer(address, amount);
    const amountHex = encoded.slice(-64);
    const decoded = new BigNumber(amountHex, 16);
    expect(decoded).toEqual(amount);
  });
});

describe("abiDecodeTrc20Transfer", () => {
  it("decodes TRC20 transfer data correctly", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("1000000");
    const data =
      "a9059cbb" + recipientHex.padStart(64, "0") + amount.toString(16).padStart(64, "0");

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.to).toBe("41" + recipientHex);
    expect(result!.amount).toEqual(amount);
  });

  it("handles data with 0x prefix", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("500000");
    const data =
      "0xa9059cbb" + recipientHex.padStart(64, "0") + amount.toString(16).padStart(64, "0");

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(amount);
  });

  it("returns null for non-transfer function selector", () => {
    const data = "12345678" + "0".repeat(128);

    const result = abiDecodeTrc20Transfer(data);

    expect(result).toBeNull();
  });

  it("returns null for data that is too short", () => {
    const result = abiDecodeTrc20Transfer("a9059cbb");

    expect(result).toBeNull();
  });

  it("decodes large amounts without precision loss", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("1000000000000000000000000000");
    const data =
      "a9059cbb" + recipientHex.padStart(64, "0") + amount.toString(16).padStart(64, "0");

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(amount);
  });

  it("returns null for data with non-hex characters", () => {
    const data = "a9059cbb" + "g".repeat(128);

    const result = abiDecodeTrc20Transfer(data);

    expect(result).toBeNull();
  });

  it("returns null for data with special characters", () => {
    const data = "a9059cbb" + "0".repeat(60) + "$$$$" + "0".repeat(64);

    const result = abiDecodeTrc20Transfer(data);

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = abiDecodeTrc20Transfer("");

    expect(result).toBeNull();
  });

  it("decodes zero amount correctly", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const data = "a9059cbb" + recipientHex.padStart(64, "0") + "0".repeat(64);

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(new BigNumber(0));
  });

  it("handles uppercase selector", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("1000000");
    const data =
      "A9059CBB" + recipientHex.padStart(64, "0") + amount.toString(16).padStart(64, "0");

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(amount);
  });

  it("handles data with extra trailing bytes", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("1000000");
    const data =
      "a9059cbb" +
      recipientHex.padStart(64, "0") +
      amount.toString(16).padStart(64, "0") +
      "deadbeef";

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(amount);
  });

  it("roundtrip encode/decode preserves data", () => {
    const address = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("123456789012345678901234567890");
    const encoded = "a9059cbb" + abiEncodeTrc20Transfer(address, amount);

    const decoded = abiDecodeTrc20Transfer(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.to).toBe("41" + address);
    expect(decoded!.amount).toEqual(amount);
  });

  it("decodes max uint256 value", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const maxUint256 = new BigNumber(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    );
    const data = "a9059cbb" + recipientHex.padStart(64, "0") + "f".repeat(64);

    const result = abiDecodeTrc20Transfer(data);

    expect(result).not.toBeNull();
    expect(result!.amount).toEqual(maxUint256);
  });
});
