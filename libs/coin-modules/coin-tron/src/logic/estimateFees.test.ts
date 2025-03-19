import { estimateFees } from "./estimateFees";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIVE } from "./constants";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { TronToken } from "../types";

describe("estimateFees", () => {
  it("should calculate fees for native trx transactionIntent", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIVE.toString()));
  });
  it("should calculate fees for trc10 transactionIntent", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      asset: {
        standard: "trc10",
        tokenId: "1002000",
      },
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIVE.toString()));
  });

  it("should calculate fees for trc20 transactionIntent", async () => {
    const transactionIntent: TransactionIntent<TronToken> = {
      type: "send",
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      asset: {
        standard: "trc20",
        contractAddress: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      },
    };
    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(ACTIVATION_FEES_TRC_20.toString()));
  });
});
