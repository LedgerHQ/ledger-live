import { createApi } from "./index";
import * as logic from "../logic";
import { TEST_ADDRESSES, TEST_BLOCK_HEIGHTS } from "../test/fixtures";
import type {
  TransactionIntent,
  MemoNotSupported,
  Balance,
} from "@ledgerhq/coin-framework/api/index";

// Mock the logic module
jest.mock("../logic");

const mockedLogic = logic as jest.Mocked<typeof logic>;

describe("createApi", () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi();
  });

  describe("broadcast", () => {
    it("should delegate to logic.broadcast", async () => {
      mockedLogic.broadcast.mockResolvedValueOnce("txhash123");

      const result = await api.broadcast("signed_tx_data");

      expect(mockedLogic.broadcast).toHaveBeenCalledWith("signed_tx_data");
      expect(result).toBe("txhash123");
    });
  });

  describe("combine", () => {
    it("should delegate to logic.combine", () => {
      mockedLogic.combine.mockReturnValueOnce("combined_tx");

      const result = api.combine("unsigned_tx", "signature");

      expect(mockedLogic.combine).toHaveBeenCalledWith("unsigned_tx", "signature");
      expect(result).toBe("combined_tx");
    });
  });

  describe("getBalance", () => {
    it("should delegate to logic.getBalance", async () => {
      const mockBalances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];
      mockedLogic.getBalance.mockResolvedValueOnce(mockBalances);

      const result = await api.getBalance(TEST_ADDRESSES.F1_ADDRESS);

      expect(mockedLogic.getBalance).toHaveBeenCalledWith(TEST_ADDRESSES.F1_ADDRESS);
      expect(result).toEqual(mockBalances);
    });
  });

  describe("lastBlock", () => {
    it("should delegate to logic.lastBlock", async () => {
      mockedLogic.lastBlock.mockResolvedValueOnce({
        height: TEST_BLOCK_HEIGHTS.CURRENT,
        hash: "blockhash",
      });

      const result = await api.lastBlock();

      expect(mockedLogic.lastBlock).toHaveBeenCalled();
      expect(result.height).toBe(TEST_BLOCK_HEIGHTS.CURRENT);
    });
  });

  describe("getSequence", () => {
    it("should delegate to logic.getSequence", async () => {
      mockedLogic.getSequence.mockResolvedValueOnce(42n);

      const result = await api.getSequence(TEST_ADDRESSES.F1_ADDRESS);

      expect(mockedLogic.getSequence).toHaveBeenCalledWith(TEST_ADDRESSES.F1_ADDRESS);
      expect(result).toBe(42n);
    });
  });

  describe("unsupported methods", () => {
    it("getStakes should throw not supported error", async () => {
      await expect(api.getStakes(TEST_ADDRESSES.F1_ADDRESS)).rejects.toThrow(
        "getStakes is not supported for Filecoin",
      );
    });

    it("getRewards should throw not supported error", async () => {
      await expect(api.getRewards(TEST_ADDRESSES.F1_ADDRESS)).rejects.toThrow(
        "getRewards is not supported for Filecoin",
      );
    });

    it("getValidators should throw not supported error", async () => {
      await expect(api.getValidators()).rejects.toThrow(
        "getValidators is not supported for Filecoin",
      );
    });

    it("getBlock should throw not supported error", async () => {
      await expect(api.getBlock(1000)).rejects.toThrow("getBlock is not supported for Filecoin");
    });

    it("getBlockInfo should throw not supported error", async () => {
      await expect(api.getBlockInfo(1000)).rejects.toThrow(
        "getBlockInfo is not supported for Filecoin",
      );
    });

    it("craftRawTransaction should throw not supported error", async () => {
      await expect(api.craftRawTransaction("tx", "sender", "pubkey", 0n)).rejects.toThrow(
        "craftRawTransaction is not supported for Filecoin",
      );
    });
  });

  describe("craftTransaction", () => {
    it("should throw for non-send intent", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "staking",
        type: "delegate",
        sender: TEST_ADDRESSES.F1_ADDRESS,
        recipient: TEST_ADDRESSES.RECIPIENT_F1,
        amount: 100n,
        asset: { type: "native" },
      };

      await expect(api.craftTransaction(intent)).rejects.toThrow(
        "Only send transaction intent is supported",
      );
    });

    it("should craft transaction for send intent", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.F1_ADDRESS,
        recipient: TEST_ADDRESSES.RECIPIENT_F1,
        amount: 100000000000000000n,
        asset: { type: "native" },
      };

      mockedLogic.getSequence.mockResolvedValueOnce(5n);
      mockedLogic.estimateFees.mockResolvedValueOnce({
        value: 100000000000n,
        parameters: {
          gasFeeCap: 100000n,
          gasPremium: 50000n,
          gasLimit: 1000000n,
        },
      });
      mockedLogic.craftTransaction.mockResolvedValueOnce({
        transaction: '{"txPayload":"abc"}',
        details: {},
      });

      const result = await api.craftTransaction(intent);

      expect(result.transaction).toBeDefined();
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees for native transfer", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.F1_ADDRESS,
        recipient: TEST_ADDRESSES.RECIPIENT_F1,
        amount: 100000000000000000n,
        asset: { type: "native" },
      };

      mockedLogic.estimateFees.mockResolvedValueOnce({
        value: 100000000000n,
        parameters: {
          gasFeeCap: 100000n,
          gasPremium: 50000n,
          gasLimit: 1000000n,
        },
      });

      const result = await api.estimateFees(intent);

      expect(result.value).toBe(100000000000n);
      expect(mockedLogic.estimateFees).toHaveBeenCalledWith(
        TEST_ADDRESSES.F1_ADDRESS,
        TEST_ADDRESSES.RECIPIENT_F1,
        100000000000000000n,
        0, // Transfer method
        undefined,
      );
    });
  });

  describe("listOperations", () => {
    it("should list operations with pagination", async () => {
      mockedLogic.listOperations.mockResolvedValueOnce([[], ""]);

      const result = await api.listOperations(TEST_ADDRESSES.F1_ADDRESS, {
        minHeight: 1000,
        order: "asc",
      });

      expect(result).toEqual([[], ""]);
    });
  });

  describe("validateIntent", () => {
    it("should validate transaction intent", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESSES.F1_ADDRESS,
        recipient: TEST_ADDRESSES.RECIPIENT_F1,
        amount: 100000000000000000n,
        asset: { type: "native" },
      };
      const balances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];

      mockedLogic.validateIntent.mockResolvedValueOnce({
        errors: {},
        warnings: {},
        estimatedFees: 0n,
        amount: 100000000000000000n,
        totalSpent: 100000000000000000n,
      });

      const result = await api.validateIntent(intent, balances);

      expect(result.errors).toEqual({});
      expect(mockedLogic.validateIntent).toHaveBeenCalled();
    });
  });
});
