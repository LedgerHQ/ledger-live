import { BigNumber } from "bignumber.js";
import {
  makeRandomPrivKey,
  makeSTXTokenTransfer,
  privateKeyToPublic,
  publicKeyToHex,
} from "@stacks/transactions";
import { broadcast } from "./broadcast";

const RECIPIENT_ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    // @stacks/transactions@7 dropped AnchorMode from the builder options (Nakamoto has no
    // anchor-block concept) and makeRandomPrivKey now returns the private key hex directly.
    const senderKey = makeRandomPrivKey();
    const feeMicroStx = new BigNumber(5000);
    const amountMicroStx = new BigNumber(1);

    const signedTx = await makeSTXTokenTransfer({
      senderKey,
      amount: amountMicroStx.toFixed(),
      recipient: RECIPIENT_ADDRESS,
      network: "mainnet",
      client: { baseUrl: "https://stacks.coin.ledger.com" },
      fee: feeMicroStx.toFixed(),
      nonce: "0",
    });

    const sc = signedTx.auth.spendingCondition;
    if (!("signature" in sc)) {
      throw new Error("expected single-sig spending condition");
    }

    // The node's actual rejection reason lives in the response body, but live-network's generic
    // error-body parser (shared across every chain, out of scope here) doesn't reliably surface
    // Stacks' specific error shape into `.message` -- assert on the fields `makeError` always
    // sets directly on the thrown error instead (status/name), not the message text.
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
            network: "mainnet",
            xpub: publicKeyToHex(privateKeyToPublic(senderKey)),
          },
        },
      } as any),
    ).rejects.toMatchObject({ name: "LedgerAPI4xx", status: 400 });
  });
});
