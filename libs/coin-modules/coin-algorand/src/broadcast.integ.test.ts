import algosdk, { base64ToBytes, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { broadcast } from "./broadcast";
import coinConfig, { type AlgorandCoinConfig } from "./config";
import { getTransactionParams } from "./network";

describe("Broadcast", () => {
  const mockAlgorandConfig: AlgorandCoinConfig = {
    status: { type: "active" },
    name: "Algorand",
    unit: { name: "ALGO", code: "ALGO", magnitude: 6 },
    node: "https://algorand.coin.ledger.com/ps2/v2",
    indexer: "",
  };
  beforeAll(() => {
    coinConfig.setCoinConfig(() => mockAlgorandConfig as any);
  });

  it("throws on insufficient funds", async () => {
    const sender = algosdk.generateAccount();
    const receiver = algosdk.generateAccount();
    const params = await getTransactionParams(mockAlgorandConfig);
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

    await expect(broadcast({ signedOperation: { signature: hex } } as any)).rejects.toThrow(
      /overspend/,
    );
  });
});
