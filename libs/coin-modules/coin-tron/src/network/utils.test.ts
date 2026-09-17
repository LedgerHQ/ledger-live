import BigNumber from "bignumber.js";
import {
  abiDecodeTrc20Transfer,
  abiEncodeTrc20Transfer,
  decodeTrc20TransferLog,
  TRC20_APPROVAL_EVENT_TOPIC,
  TRC20_TRANSFER_EVENT_TOPIC,
  trc20ContractAddressFromLogs,
} from "./utils";

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

  it("returns null for odd-length hex string", () => {
    const recipientHex = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const amount = new BigNumber("1000000");
    const validData =
      "a9059cbb" + recipientHex.padStart(64, "0") + amount.toString(16).padStart(64, "0");
    const oddLengthData = validData + "f";

    const result = abiDecodeTrc20Transfer(oddLengthData);

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

// The constructor mint of tx 4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399:
// a TRC20 deployed and minted in one transaction, whose only trace of the token is this log.
const constructorMintLog = {
  address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
  topics: [
    TRC20_TRANSFER_EVENT_TOPIC,
    "0000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f",
  ],
  data: "00000000000000000000000000000000000004ee2d6d415b85acef8100000000",
};

const trc20ContractHex = "411fd80baee7c53e92e69447ff8c48d6b3a008572f";
const zeroAddressHex = "41" + "0".repeat(40);
const minterHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";

describe("decodeTrc20TransferLog", () => {
  it("decodes the token, both parties and the amount of a Transfer event", () => {
    expect(decodeTrc20TransferLog(constructorMintLog)).toEqual({
      contractAddress: trc20ContractHex,
      from: zeroAddressHex,
      to: minterHex,
      amount: new BigNumber("100000000000000000000000000000000"),
    });
  });

  it("returns null for an event that is not a Transfer", () => {
    expect(
      decodeTrc20TransferLog({
        ...constructorMintLog,
        topics: [TRC20_APPROVAL_EVENT_TOPIC, ...constructorMintLog.topics.slice(1)],
      }),
    ).toBeNull();
  });

  it("returns null when the log carries no amount", () => {
    expect(decodeTrc20TransferLog({ ...constructorMintLog, data: "" })).toBeNull();
    expect(decodeTrc20TransferLog({ ...constructorMintLog, data: "not-hex" })).toBeNull();
  });

  it("returns null when the indexed parties are missing", () => {
    expect(
      decodeTrc20TransferLog({ ...constructorMintLog, topics: [TRC20_TRANSFER_EVENT_TOPIC] }),
    ).toBeNull();
  });
});

describe("trc20ContractAddressFromLogs", () => {
  it("returns the emitting contract of the matching Transfer event", () => {
    expect(
      trc20ContractAddressFromLogs([constructorMintLog], { from: zeroAddressHex, to: minterHex }),
    ).toBe(trc20ContractHex);
  });

  it("returns the only token of the transaction when no event matches the parties", () => {
    expect(
      trc20ContractAddressFromLogs([constructorMintLog], {
        from: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
      }),
    ).toBe(trc20ContractHex);
  });

  it("picks the matching token when the transaction touches several", () => {
    const otherToken = {
      ...constructorMintLog,
      address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
      topics: [
        TRC20_TRANSFER_EVENT_TOPIC,
        "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f",
        "0000000000000000000000000000000000000000000000000000000000000000",
      ],
    };

    expect(
      trc20ContractAddressFromLogs([constructorMintLog, otherToken], {
        from: zeroAddressHex,
        to: minterHex,
      }),
    ).toBe(trc20ContractHex);
  });

  it("returns undefined rather than guessing between several unmatched tokens", () => {
    const otherToken = {
      ...constructorMintLog,
      address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
    };

    expect(trc20ContractAddressFromLogs([constructorMintLog, otherToken])).toBeUndefined();
  });

  it("returns undefined when there is no token event at all", () => {
    expect(trc20ContractAddressFromLogs(undefined)).toBeUndefined();
    expect(trc20ContractAddressFromLogs([])).toBeUndefined();
    expect(
      trc20ContractAddressFromLogs([{ ...constructorMintLog, topics: ["deadbeef"] }]),
    ).toBeUndefined();
  });

  it("also reads the token out of an Approval event", () => {
    expect(
      trc20ContractAddressFromLogs([
        {
          ...constructorMintLog,
          topics: [TRC20_APPROVAL_EVENT_TOPIC, ...constructorMintLog.topics.slice(1)],
        },
      ]),
    ).toBe(trc20ContractHex);
  });
});
