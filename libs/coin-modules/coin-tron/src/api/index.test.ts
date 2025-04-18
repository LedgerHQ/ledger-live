import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
} from "../logic";
import coinConfig from "../config";
import { TronConfig } from "../config";
import { Api, Pagination, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { createApi } from ".";
import { TronAsset } from "../types";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn(),
  lastBlock: jest.fn(),
}));

describe("createApi", () => {
  const mockTronConfig: TronConfig = { explorer: { url: "iamaurl" } } as TronConfig;
  let setCoinConfigSpy: jest.SpyInstance;

  it("should set the coin config value", () => {
    setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockTronConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();

    expect(config).toEqual(
      expect.objectContaining({
        ...mockTronConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(mockTronConfig);

    // Check that methods are set with what we expect
    expect(api.broadcast).toBe(broadcast);
    expect(api.combine).toBe(combine);
    expect(api.craftTransaction).toBe(craftTransaction);
    expect(api.estimateFees).toBe(estimateFees);
    expect(api.getBalance).toBe(getBalance);
    expect(api.lastBlock).toBe(lastBlock);
    expect(api.listOperations).toBe(listOperations);
  });

  it("should pass parameters well", async () => {
    const api: Api<TronAsset> = createApi(mockTronConfig);
    const intent: TransactionIntent<TronAsset> = {
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: {
        type: "token",
        standard: "trc10",
        tokenId: "1002000",
      },
    };
    // Simulate calling all methods
    await api.broadcast("transaction");
    api.combine("tx", "signature", "pubkey");
    await api.craftTransaction(intent);
    await api.estimateFees(intent);
    await api.getBalance("address");
    await api.lastBlock();
    await api.listOperations("address", {} as Pagination);

    // Test that each of the methods was called with correct arguments
    expect(broadcast).toHaveBeenCalledWith("transaction");
    expect(combine).toHaveBeenCalledWith("tx", "signature", "pubkey");
    expect(estimateFees).toHaveBeenCalledWith(intent);
    expect(craftTransaction).toHaveBeenCalledWith(intent);
    expect(getBalance).toHaveBeenCalledWith("address");
    expect(lastBlock).toHaveBeenCalled();
    expect(listOperations).toHaveBeenCalledWith("address", {});
  });
});
