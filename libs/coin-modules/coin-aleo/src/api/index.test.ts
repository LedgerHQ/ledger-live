import type {
  TransactionIntent,
  FeeEstimation,
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/types";
import type { AleoTransactionIntentData } from "../types";
import coinConfig from "../config";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { createApi } from "./index";

describe("createApi", () => {
  const mockConfig = getMockedConfig("testnet");

  const createMockTransactionIntent = (): TransactionIntent<
    MemoNotSupported,
    AleoTransactionIntentData
  > => ({
    intentType: "transaction",
    asset: { type: "native" },
    type: "fee_public",
    amount: BigInt(1000),
    sender: "aleo1sender1234567890123456789012345678901234567",
    recipient: "aleo1recipient123456789012345678901234567890",
    data: { type: "fee_public", priorityFee: 1040, executionId: "ex1test" },
  });

  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig, "aleo");
    const config = coinConfig.getCoinConfig();

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({ status: { type: "active" } });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(mockConfig, "aleo");

    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
  });

  describe("craftTransaction", () => {
    it("should reject when customFees are provided", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent = createMockTransactionIntent();
      const customFees: FeeEstimation = { value: BigInt(1000) };

      await expect(api.craftTransaction(txIntent, customFees)).rejects.toThrow(
        "customFees are not supported",
      );
    });

    it("should reject when useAllAmount is true", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        ...createMockTransactionIntent(),
        useAllAmount: true,
      };

      await expect(api.craftTransaction(txIntent)).rejects.toThrow(
        "useAllAmount is not supported yet",
      );
    });
  });
});
