import { addressToScriptPublicKey } from "../logic/kaspaAddresses";
import {
  KaspaHwTransaction,
  KaspaHwTransactionInput,
  KaspaHwTransactionOutput,
} from "../types/kaspaHwTransaction";
import { broadcast } from "./broadcast";

const BURN_ADDRESS = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
const FAKE_PREV_TX_ID = "a".repeat(64);
const FAKE_SIGNATURE = "b".repeat(128);

describe("Broadcast", () => {
  it("throws orphan error when referenced UTXO does not exist", async () => {
    const input = new KaspaHwTransactionInput({
      value: 1000,
      prevTxId: FAKE_PREV_TX_ID,
      outpointIndex: 0,
      addressType: 0,
      addressIndex: 0,
      address: BURN_ADDRESS,
    });
    input.setSignature(FAKE_SIGNATURE);

    const output = new KaspaHwTransactionOutput({
      value: 900,
      scriptPublicKey: addressToScriptPublicKey(BURN_ADDRESS),
    });

    const tx = new KaspaHwTransaction({
      inputs: [input],
      outputs: [output],
      version: 0,
      fee: 100,
    });

    const signature = JSON.stringify(tx.toApiJSON());

    await expect(
      broadcast({
        signedOperation: {
          signature,
          operation: { id: "integ", hash: "", extra: {} },
        },
      } as any),
    ).rejects.toThrow(/Rejected transaction .+ is an orphan where orphan is disallowed/);
  });
});
