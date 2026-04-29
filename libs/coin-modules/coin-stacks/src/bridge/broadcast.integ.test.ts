import { BigNumber } from "bignumber.js";
import { StacksMainnet } from "@stacks/network";
import {
  AnchorMode,
  makeRandomPrivKey,
  makeSTXTokenTransfer,
  privateKeyToString,
  pubKeyfromPrivKey,
  publicKeyToString,
} from "@stacks/transactions";
import { broadcast } from "./broadcast";

const RECIPIENT_ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const senderKey = privateKeyToString(makeRandomPrivKey());
    const feeMicroStx = new BigNumber(5000);
    const amountMicroStx = new BigNumber(1);

    const signedTx = await makeSTXTokenTransfer({
      senderKey,
      amount: amountMicroStx.toFixed(),
      recipient: RECIPIENT_ADDRESS,
      anchorMode: AnchorMode.Any,
      network: new StacksMainnet({ url: "https://stacks.coin.ledger.com" }),
      fee: feeMicroStx.toFixed(),
      nonce: "0",
    });

    const sc = signedTx.auth.spendingCondition;
    if (!("signature" in sc)) {
      throw new Error("expected single-sig spending condition");
    }

    await expect(
      broadcast({
        signedOperation: {
          operation: {
            transactionSequenceNumber: new BigNumber(0),
            extra: {},
            value: amountMicroStx.plus(feeMicroStx),
            fee: feeMicroStx,
            recipients: [RECIPIENT_ADDRESS],
          },
          signature: sc.signature.data,
          rawData: {
            anchorMode: AnchorMode.Any,
            network: "mainnet",
            xpub: publicKeyToString(pubKeyfromPrivKey(senderKey)),
          },
        },
      } as any),
    ).rejects.toThrow("transaction rejected");
  });
});
