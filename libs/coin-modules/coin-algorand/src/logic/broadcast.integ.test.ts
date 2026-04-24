import algosdk, { base64ToBytes, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { broadcast } from "./broadcast";
import coinConfig from "../config";
import { getTransactionParams } from "../network/algod";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      () =>
        ({
          status: { type: "active" },
          node: "https://algorand.coin.ledger.com/ps2/v2",
        }) as any,
    );
  });

  it("throws on insufficient funds", async () => {
    const sender = algosdk.generateAccount();
    const receiver = algosdk.generateAccount();
    const params = await getTransactionParams();
    const tx = makePaymentTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiver.addr,
      amount: 1,
      suggestedParams: {
        ...params,
        firstValid: params.lastRound,
        lastValid: params.lastRound + 1000,
        genesisHash: base64ToBytes(params.genesisHash),
      },
    });
    const signed = tx.signTxn(sender.sk);
    const hex = Buffer.from(signed).toString("hex");

    await expect(broadcast(hex)).rejects.toThrow(/overspend/);
  });
});
