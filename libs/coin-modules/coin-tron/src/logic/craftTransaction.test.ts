import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import { decode58Check } from "../network/format";
import { TronToken } from "../types";
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
      undefined,
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should use fees limit when user provided it for a TRC20 transaction", async () => {
    const feesLimit: bigint = 99n;
    const amount: number = 1000;
    const transactionIntent = {
      asset: {
        standard: "trc20",
        contractAddress: "contractAddress",
      },
      amount: BigInt(amount),
    } as TransactionIntent<TronToken>;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(transactionIntent, feesLimit);
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      Number(feesLimit),
    );
  });

  it("should not provide a fees limit when a user does not provide it for a TRC20 transaction ", async () => {
    const amount = 1000;
    const transactionIntent = {
      asset: {
        standard: "trc20",
        contractAddress: "contractAddress",
      },
      amount: BigInt(amount),
    } as TransactionIntent<TronToken>;

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
    );
  });

  it.each([BigInt(2 * Number.MIN_SAFE_INTEGER), BigInt(2 * Number.MAX_SAFE_INTEGER)])(
    "should throw an error when user provide fees which exceeds Typescript Number type value limit for a TRC20 transaction",
    async (feesLimit: bigint) => {
      try {
        await craftTransaction(
          {
            asset: {
              standard: "trc20",
              contractAddress: "contractAddress",
            },
          } as TransactionIntent<TronToken>,
          feesLimit,
        );
      } catch (error) {
        expect((error as Error).message).toEqual(
          `Fees limit must be between ${Number.MIN_SAFE_INTEGER} and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
        );
      }
    },
  );
});
