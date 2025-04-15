import type { Api, Pagination, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { AptosAsset } from "../types/assets";
import type { AptosConfig } from "../config";
import { createApi } from "./api";
import coinConfig from "../config";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

jest.mock(".", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn(),
  lastBlock: jest.fn(),
}));

describe("createApi", () => {
  const mockAptosConfig: AptosConfig = {} as AptosConfig;

  it("should set the coin config value", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockAptosConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();

    expect(config).toEqual(
      expect.objectContaining({
        ...mockAptosConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should return an API object with alpaca api methods", () => {
    const api: Api<AptosAsset> = createApi(mockAptosConfig);

    // Check that methods are set with what we expect
    expect(api.broadcast).toBeTruthy();
    expect(api.combine).toBeTruthy();
    expect(api.craftTransaction).toBeTruthy();
    expect(api.estimateFees).toBeTruthy();
    expect(api.getBalance).toBeTruthy();
    expect(api.lastBlock).toBeTruthy();
    expect(api.listOperations).toBeTruthy();
  });

  it("should throw an exception when called", async () => {
    const api: Api<AptosAsset> = createApi(mockAptosConfig);
    const intent: TransactionIntent<AptosAsset> = {
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: { type: "native" },
    };
    // Simulate calling all methods
    const notImplementedMessage = "Not Implemented";
    await expect(() => api.broadcast("tx")).rejects.toThrow(notImplementedMessage);
    expect(() => {
      api.combine("tx", "signature", "pubkey");
    }).toThrow(notImplementedMessage);
    await expect(() => api.craftTransaction(intent)).rejects.toThrow(notImplementedMessage);
    await expect(() => api.estimateFees(intent)).rejects.toThrow(notImplementedMessage);
    await expect(() => api.getBalance("address")).rejects.toThrow(notImplementedMessage);
    await expect(() => api.lastBlock()).rejects.toThrow(notImplementedMessage);
    await expect(() => api.listOperations("address", {} as Pagination)).rejects.toThrow(
      notImplementedMessage,
    );
  });
});
