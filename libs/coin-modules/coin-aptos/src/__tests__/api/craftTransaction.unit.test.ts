import { Hex, RawTransaction, Deserializer } from "@aptos-labs/ts-sdk";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { createApi } from "../../api";
import type { AptosAsset } from "../../types/assets";
import { AptosAPI } from "../../network";
import { APTOS_ASSET_ID } from "../../constants";

jest.mock("../../network");
let mockedAptosApi: jest.Mocked<any>;

jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

describe("craftTransaction", () => {
  beforeEach(() => {
    mockedAptosApi = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const SENDER_ADDR = "APTOS_1_ADDRESS";
  const RECIPIENT_ADDR = "APTOS_2_ADDRESS";

  const hexRawTx =
    "0xfdde1012c0fac1f9a121eb3c8481c90d473df1c4180c070bd4f2549a6d06180400000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002203f5f0fcc8a909f23806e5efbdc1757e653fcd744de516a7de12b99b8417925c1080a00000000000000400d03000000000064000000000000002c721b6800000000b7";

  const rawTxn = RawTransaction.deserialize(
    new Deserializer(Hex.fromHexString(hexRawTx).toUint8Array()),
  );

  it("creates a coin transaction", async () => {
    const mockGenerateTransaction = jest.fn().mockResolvedValue(rawTxn);
    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 12345 }]);
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
      getBalances: mockGetBalances,
    }));

    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: SENDER_ADDR,
      senderPublicKey: "public-key",
      recipient: RECIPIENT_ADDR,
      amount: 10n,
      asset: { type: "token", standard: "coin", contractAddress: "0x42::token::Token" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx).valid).toBeTruthy();
    expect(mockGetBalances).toHaveBeenCalledTimes(0);
    expect(mockGenerateTransaction).toHaveBeenCalledTimes(1);

    expect(mockGenerateTransaction).toHaveBeenCalledWith(
      SENDER_ADDR,
      expect.objectContaining({
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: ["0x42::token::Token"],
        functionArguments: [RECIPIENT_ADDR, txArg.amount.toString()],
      }),
      expect.anything(),
    );
  });

  it("creates a native coin transaction using all amount available", async () => {
    const mockGenerateTransaction = jest.fn().mockResolvedValue(rawTxn);
    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 12345 }]);
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
      getBalances: mockGetBalances,
    }));

    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: SENDER_ADDR,
      senderPublicKey: "public-key",
      recipient: RECIPIENT_ADDR,
      amount: 0n,
      asset: { type: "native" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx).valid).toBeTruthy();
    expect(mockGetBalances).toHaveBeenCalledTimes(1);
    expect(mockGenerateTransaction).toHaveBeenCalledTimes(1);

    expect(mockGenerateTransaction).toHaveBeenCalledWith(
      SENDER_ADDR,
      expect.objectContaining({
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: [APTOS_ASSET_ID],
        functionArguments: [RECIPIENT_ADDR, "12345"],
      }),
      expect.anything(),
    );
  });

  it("creates a coin token transaction", async () => {
    const mockGenerateTransaction = jest.fn().mockResolvedValue(rawTxn);
    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: "0x42::token::Token", amount: 12345 }]);
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
      getBalances: mockGetBalances,
    }));

    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: SENDER_ADDR,
      senderPublicKey: "public-key",
      recipient: RECIPIENT_ADDR,
      amount: 10n,
      asset: { type: "token", standard: "coin", contractAddress: "0x42::token::Token" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx).valid).toBeTruthy();
    expect(mockGetBalances).toHaveBeenCalledTimes(0);
    expect(mockGenerateTransaction).toHaveBeenCalledTimes(1);

    expect(mockGenerateTransaction).toHaveBeenCalledWith(
      SENDER_ADDR,
      expect.objectContaining({
        function: "0x1::aptos_account::transfer_coins",
        typeArguments: ["0x42::token::Token"],
        functionArguments: [RECIPIENT_ADDR, txArg.amount.toString()],
      }),
      expect.anything(),
    );
  });

  it("creates a fungible_asset token transaction using all amount available", async () => {
    const mockGenerateTransaction = jest.fn().mockResolvedValue(rawTxn);
    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: "0x42", amount: 12345 }]);
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
      getBalances: mockGetBalances,
    }));

    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: SENDER_ADDR,
      senderPublicKey: "public-key",
      recipient: RECIPIENT_ADDR,
      amount: 0n,
      asset: { type: "token", standard: "fungible_asset", contractAddress: "0x42" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx).valid).toBeTruthy();
    expect(mockGetBalances).toHaveBeenCalledTimes(1);
    expect(mockGenerateTransaction).toHaveBeenCalledTimes(1);

    expect(mockGenerateTransaction).toHaveBeenCalledWith(
      SENDER_ADDR,
      expect.objectContaining({
        function: "0x1::primary_fungible_store::transfer",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: ["0x42", RECIPIENT_ADDR, "12345"],
      }),
      expect.anything(),
    );
  });

  it("throws an exception for invalid tokenType", async () => {
    const mockGenerateTransaction = jest.fn().mockResolvedValue(rawTxn);
    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: "0x42::token::Token", amount: 12345 }]);
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
      getBalances: mockGetBalances,
    }));

    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: SENDER_ADDR,
      senderPublicKey: "public-key",
      recipient: RECIPIENT_ADDR,
      amount: 10n,
      asset: { type: "token", standard: "asset", contractAddress: "0x42::token::Token" },
    };

    expect(async () => await api.craftTransaction(txArg)).rejects.toThrow(
      "Token type asset not supported",
    );

    expect(mockGetBalances).toHaveBeenCalledTimes(0);
    expect(mockGenerateTransaction).toHaveBeenCalledTimes(0);
  });
});
