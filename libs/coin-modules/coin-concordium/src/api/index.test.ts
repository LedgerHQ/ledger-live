import type { ConcordiumCoinConfig } from "../types/config";
import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../common-logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  craftRawTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  getBlock: jest.fn(),
  getBlockInfo: jest.fn(),
  getNextValidSequence: jest.fn(),
  lastBlock: jest.fn(),
  listOperations: jest.fn(),
}));

const {
  craftTransaction: craftTransactionMock,
  craftRawTransaction: craftRawTransactionMock,
  estimateFees: estimateFeesMock,
  getNextValidSequence: getNextValidSequenceMock,
} = jest.requireMock("../common-logic");

const mockConfig: ConcordiumCoinConfig = {
  networkType: "testnet",
  grpcUrl: "https://grpc.testnet.concordium.com",
  grpcPort: 20000,
  proxyUrl: "https://wallet-proxy.testnet.concordium.com",
  minReserve: 0,
};

describe("createApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return every api methods", () => {
    expect(createApi(mockConfig, "concordium")).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
    });
  });

  describe("craftTransaction", () => {
    it("should craft transaction with memo", async () => {
      // GIVEN
      const api = createApi(mockConfig, "concordium");
      getNextValidSequenceMock.mockResolvedValue(BigInt(5));
      craftTransactionMock.mockResolvedValue({
        serializedTransaction: "serialized-tx-with-memo",
      });
      const transactionIntent = {
        sender: VALID_ADDRESS,
        recipient: VALID_ADDRESS_2,
        amount: BigInt(1000000),
        memo: { type: "string" as const, value: "test memo" },
      };

      // WHEN
      const result = await api.craftTransaction(transactionIntent);

      // THEN
      expect(getNextValidSequenceMock).toHaveBeenCalledWith(
        transactionIntent.sender,
        expect.objectContaining({ id: "concordium" }),
      );
      expect(craftTransactionMock).toHaveBeenCalledWith(
        { address: transactionIntent.sender, nextSequenceNumber: BigInt(5) },
        expect.objectContaining({
          recipient: transactionIntent.recipient,
          memo: "test memo",
        }),
      );
      expect(result).toEqual({ transaction: "serialized-tx-with-memo" });
    });

    it("should craft transaction without memo", async () => {
      // GIVEN
      const api = createApi(mockConfig, "concordium");
      getNextValidSequenceMock.mockResolvedValue(BigInt(10));
      craftTransactionMock.mockResolvedValue({
        serializedTransaction: "serialized-tx-no-memo",
      });
      const transactionIntent = {
        sender: VALID_ADDRESS,
        recipient: VALID_ADDRESS_2,
        amount: BigInt(500000),
      };

      // WHEN
      const result = await api.craftTransaction(transactionIntent);

      // THEN
      expect(craftTransactionMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({ memo: expect.anything() }),
      );
      expect(result).toEqual({ transaction: "serialized-tx-no-memo" });
    });
  });

  describe("craftRawTransaction", () => {
    it("should craft raw transaction", async () => {
      // GIVEN
      const api = createApi(mockConfig, "concordium");
      craftRawTransactionMock.mockResolvedValue({
        serializedTransaction: "raw-serialized-tx",
      });

      // WHEN
      const result = await api.craftRawTransaction(
        "raw-tx-data",
        VALID_ADDRESS,
        "public-key-hex",
        BigInt(42),
      );

      // THEN
      expect(craftRawTransactionMock).toHaveBeenCalledWith(
        "raw-tx-data",
        VALID_ADDRESS,
        "public-key-hex",
        BigInt(42),
      );
      expect(result).toEqual({ transaction: "raw-serialized-tx" });
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees for transaction with memo", async () => {
      // GIVEN
      const api = createApi(mockConfig, "concordium");
      craftTransactionMock.mockResolvedValue({
        serializedTransaction: "tx-for-fee-estimate",
      });
      estimateFeesMock.mockResolvedValue({ cost: BigInt(1500) });
      const transactionIntent = {
        sender: VALID_ADDRESS,
        recipient: VALID_ADDRESS_2,
        amount: BigInt(1000000),
        memo: { type: "string" as const, value: "fee test" },
      };

      // WHEN
      const result = await api.estimateFees(transactionIntent);

      // THEN
      expect(craftTransactionMock).toHaveBeenCalledWith(
        { address: transactionIntent.sender },
        expect.objectContaining({ memo: "fee test" }),
      );
      expect(estimateFeesMock).toHaveBeenCalledWith(
        "tx-for-fee-estimate",
        expect.objectContaining({ id: "concordium" }),
      );
      expect(result).toEqual({ value: BigInt(1500) });
    });

    it("should estimate fees for transaction without memo", async () => {
      // GIVEN
      const api = createApi(mockConfig, "concordium");
      craftTransactionMock.mockResolvedValue({
        serializedTransaction: "tx-no-memo-for-fee",
      });
      estimateFeesMock.mockResolvedValue({ cost: BigInt(1000) });
      const transactionIntent = {
        sender: VALID_ADDRESS,
        recipient: VALID_ADDRESS_2,
        amount: BigInt(500000),
      };

      // WHEN
      const result = await api.estimateFees(transactionIntent);

      // THEN
      expect(result).toEqual({ value: BigInt(1000) });
    });
  });

  describe("unsupported methods", () => {
    it("should throw error for getStakes", () => {
      const api = createApi(mockConfig, "concordium");
      expect(() => api.getStakes("address")).toThrow("getStakes is not supported");
    });

    it("should throw error for getRewards", () => {
      const api = createApi(mockConfig, "concordium");
      expect(() => api.getRewards("address")).toThrow("getRewards is not supported");
    });

    it("should throw error for getValidators", () => {
      const api = createApi(mockConfig, "concordium");
      expect(() => api.getValidators()).toThrow("getValidators is not supported");
    });
  });
});
