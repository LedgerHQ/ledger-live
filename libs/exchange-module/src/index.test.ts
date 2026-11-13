import type { WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { ExchangeModule } from "./index";

function setup(result: unknown) {
  const request = jest.fn().mockResolvedValue(result);
  const module = new ExchangeModule({ request } as unknown as WalletAPIClient);
  return { module, request };
}

const transfer = {
  fromAccountId: "token-account-id",
  recipient: "TPayInAddress",
  amount: "10000000",
};

describe("ExchangeModule Tronify methods", () => {
  it("getTronifyQuote sends custom.exchange.tronify.getQuote with the transfer", async () => {
    const quote = {
      feeAsset: {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
      },
      value: "2900000",
      originalValue: "13500000",
    };
    const { module, request } = setup(quote);

    await expect(module.getTronifyQuote(transfer)).resolves.toEqual(quote);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("custom.exchange.tronify.getQuote", transfer);
  });

  it("createTronifyRentRecord sends custom.exchange.tronify.createRentRecord with the approved fee", async () => {
    const params = { ...transfer, approvedFee: "2900000" };
    const order = {
      orderId: "order-1",
      rawTransaction: "0a02abcd",
      paymentTxId: "f00d",
      payCoinCode: "USDT",
      payCoinAmt: "2.9",
      energyNeeded: "64285",
    };
    const { module, request } = setup(order);

    await expect(module.createTronifyRentRecord(params)).resolves.toEqual(order);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("custom.exchange.tronify.createRentRecord", params);
  });

  it("uploadTronifyHash sends custom.exchange.tronify.uploadHash with the signed payment", async () => {
    const params = {
      fromAccountId: transfer.fromAccountId,
      orderId: "order-1",
      signedTransactionHex: "deadbeef",
    };
    const { module, request } = setup({ paymentTxId: "f00d" });

    await expect(module.uploadTronifyHash(params)).resolves.toEqual({ paymentTxId: "f00d" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("custom.exchange.tronify.uploadHash", params);
  });

  it("isTronifyEnergyDelivered sends custom.exchange.tronify.isEnergyDelivered", async () => {
    const params = { fromAccountId: transfer.fromAccountId, energyNeeded: "64285" };
    const { module, request } = setup({ delivered: true });

    await expect(module.isTronifyEnergyDelivered(params)).resolves.toEqual({ delivered: true });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("custom.exchange.tronify.isEnergyDelivered", params);
  });

  it("propagates a server error unchanged", async () => {
    const error = new Error("tronify energy rental is disabled");
    const request = jest.fn().mockRejectedValue(error);
    const module = new ExchangeModule({ request } as unknown as WalletAPIClient);

    await expect(module.getTronifyQuote(transfer)).rejects.toBe(error);
  });
});
