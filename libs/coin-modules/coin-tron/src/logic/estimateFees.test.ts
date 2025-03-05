import { estimateFees } from "./estimateFees";
import { ACTIVATION_FEES, ACTIVATION_FEES_TRC_20 } from "./constants";
import { Intent } from "@ledgerhq/coin-framework/api/index";

describe("estimateFees", () => {
  it("should calculate fees for trc10 intents", async () => {
    const intent: Intent = {
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      standard: "trc10",
    };

    const result = await estimateFees(intent);

    expect(result.gross).toEqual(BigInt(ACTIVATION_FEES.toString()));
  });

  it("should calculate fees for trc20 intents", async () => {
    const intent: Intent = {
      sender: "sender1",
      recipient: "recipient1",
      amount: BigInt(1000),
      contractAddress: "contract1",
      standard: "trc20",
    };
    const result = await estimateFees(intent);

    expect(result.gross).toEqual(BigInt(ACTIVATION_FEES_TRC_20.toString()));
  });
});
