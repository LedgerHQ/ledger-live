import { BigNumber } from "bignumber.js";
import { makeRandomPrivKey, makeSTXTokenTransfer, transactionToHex } from "@stacks/transactions";
import { broadcast } from "./broadcast";

const RECIPIENT_ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("broadcast (Alpaca)", () => {
  it("propagates a real HTTP rejection from the network for an underfunded transfer", async () => {
    const senderKey = makeRandomPrivKey();
    const feeMicroStx = new BigNumber(5000);
    const amountMicroStx = new BigNumber(1);

    const signedTx = await makeSTXTokenTransfer({
      senderKey,
      amount: amountMicroStx.toFixed(),
      recipient: RECIPIENT_ADDRESS,
      network: "mainnet",
      fee: feeMicroStx.toFixed(),
      nonce: "0",
    });

    await expect(broadcast(transactionToHex(signedTx))).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      status: 400,
    });
  });
});
