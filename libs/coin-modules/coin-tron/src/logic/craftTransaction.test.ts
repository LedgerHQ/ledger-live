import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import { decode58Check } from "../network/format";
import { TronAsset } from "../types";
import { craftTransaction } from "./craftTransaction";

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

  it("should craft a standard transaction", async () => {
    const transactionIntent: TransactionIntent<TronAsset> = {
      asset: { type: "native" },
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
      undefined,
      undefined,
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should craft a TRC20 transaction", async () => {
    const transactionIntent: TransactionIntent<TronAsset> = {
      type: "send",
      asset: {
        type: "token",
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
      undefined,
      undefined,
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should use custom user fees when user provides it for crafting a TRC20 transaction", async () => {
    const customFees: bigint = 99n;
    const amount: number = 1000;
    const transactionIntent = {
      asset: {
        type: "token",
        standard: "trc20",
        contractAddress: "contractAddress",
      },
      amount: BigInt(amount),
    } as TransactionIntent<TronAsset>;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(transactionIntent, customFees);
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      Number(customFees),
      undefined,
    );
  });

  it("should not use any fees when user does not provide it for crafting a TRC20 transaction ", async () => {
    const amount = 1000;
    const transactionIntent = {
      asset: {
        type: "token",
        standard: "trc20",
        contractAddress: "contractAddress",
      },
      amount: BigInt(amount),
    } as TransactionIntent<TronAsset>;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(transactionIntent);
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      undefined,
      undefined,
    );
  });

  it.each([-1n, BigInt(2 * Number.MAX_SAFE_INTEGER)])(
    "should throw an error when user provides fees which exceeds Typescript Number type value limit for crafting a TRC20 transaction",
    async (customFees: bigint) => {
      try {
        await craftTransaction(
          {
            asset: {
              type: "token",
              standard: "trc20",
              contractAddress: "contractAddress",
            },
          } as TransactionIntent<TronAsset>,
          customFees,
        );
      } catch (error) {
        expect((error as Error).message).toEqual(
          `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
        );
      }
    },
  );
});
