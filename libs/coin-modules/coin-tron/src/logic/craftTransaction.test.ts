import { craftTransaction } from "./craftTransaction";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { decode58Check } from "../network/format";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import BigNumber from "bignumber.js";
import { TronToken } from "../types";

jest.mock("../network/format", () => ({
  decode58Check: jest.fn(),
}));

jest.mock("../network", () => ({
  post: jest.fn(),
  extendTronTxExpirationTimeBy10mn: jest.fn(),
  craftStandardTransaction: jest.fn(),
  craftTrc20Transaction: jest.fn(),
}));

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should craft a TRC20 transaction", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      asset: {
        standard: "trc20",
        contractAddress: "contractAddress",
      },
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const result = await craftTransaction(transactionIntent);

    expect(decode58Check).toHaveBeenCalledWith("recipient");
    expect(decode58Check).toHaveBeenCalledWith("sender");
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      "contractAddress",
      "recipient",
      "sender",
      new BigNumber(1000),
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should craft a standard transaction", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftStandardTransaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const result = await craftTransaction(transactionIntent);

    expect(decode58Check).toHaveBeenCalledWith("recipient");
    expect(decode58Check).toHaveBeenCalledWith("sender");
    expect(craftStandardTransaction).toHaveBeenCalledWith(
      undefined,
      "recipient",
      "sender",
      new BigNumber(1000),
      false,
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should craft a TRC10 transaction", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      asset: {
        standard: "trc10",
        tokenId: "tokenId",
      },
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftStandardTransaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const result = await craftTransaction(transactionIntent);

    expect(decode58Check).toHaveBeenCalledWith("recipient");
    expect(decode58Check).toHaveBeenCalledWith("sender");
    expect(craftStandardTransaction).toHaveBeenCalledWith(
      "tokenId",
      "recipient",
      "sender",
      new BigNumber(1000),
      true,
    );
    expect(result).toBe("extendedRawDataHex");
  });
});
