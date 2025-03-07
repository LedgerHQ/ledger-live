import { estimateFees } from "./estimateFees";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIF } from "./constants";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

describe("estimateFees", () => {
  it("should calculate fees for natif transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIF.toString()));
  });
  it("should calculate fees for trc10 transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      tokenAddress: "1002000",
    };

    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(STANDARD_FEES_NATIF.toString()));
  });

  it("should calculate fees for trc20 transactionIntent", async () => {
    const transactionIntent: TransactionIntent = {
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      standard: "trc20",
    };
    const result = await estimateFees(transactionIntent);

    expect(result).toEqual(BigInt(ACTIVATION_FEES_TRC_20.toString()));
  });
});
