import { estimateFees } from "./estimateFees";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIVE } from "./constants";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
// import { TronAsset } from "../types";

describe("estimateFees", () => {
  it("should calculate fees for native trx transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      asset: { assetType: "native" },
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIVE.toString()));
  });
  it("should calculate fees for trc10 transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      asset: {
        assetType: "token",
        assetOwner: "trc10",
        assetReference: "1002000",
      },
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIVE.toString()));
  });

  it("should calculate fees for trc20 transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      asset: {
        assetType: "token",
        assetOwner: "trc20",
        assetReference: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      },
    };
    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(ACTIVATION_FEES_TRC_20.toString()));
  });
});
