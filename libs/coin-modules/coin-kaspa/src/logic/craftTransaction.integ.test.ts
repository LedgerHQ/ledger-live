import { isValidKaspaAddress } from "./kaspaAddresses";
import { craftTransaction } from "./craftTransaction";

const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";
// Dedicated, independently-funded Kaspa account (see getBalance.integ.test.ts) — funded once and
// never spent, so it keeps spendable UTXOs for the crafts below.
const FUNDED_SENDER = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";
// 1 KAS. The account holds several KAS, so both the recipient output and the change output stay
// well above Kaspa's KIP-9 storage-mass floor (~0.2 KAS/output) and the change is not discarded.
const SEND_AMOUNT = 100_000_000n;

describe("craftTransaction (integration)", () => {
  it("rejects an invalid sender address without needing a funded fixture", async () => {
    await expect(
      craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "not-a-kaspa-address",
        recipient: RECIPIENT,
        amount: 1000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("invalid sender address");
  });

  it("validates the recipient fixture address used by the funded scenarios below", () => {
    expect(isValidKaspaAddress(RECIPIENT)).toBe(true);
  });

  describe("funded sender", () => {
    // api.mdx: "Send tx => crafted tx with corresponding amount and recipient".
    it("crafts a send with the requested amount and a change output", async () => {
      const crafted = await craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: FUNDED_SENDER,
        recipient: RECIPIENT,
        amount: SEND_AMOUNT,
        asset: { type: "native" },
      });

      const tx = JSON.parse(crafted.transaction);
      expect(tx.inputs.length).toBeGreaterThanOrEqual(1);
      expect(tx.outputs).toHaveLength(2); // recipient + change
      expect(tx.outputs[0].value).toBe(Number(SEND_AMOUNT)); // recipient output is first
      expect(tx.outputs[1].value).toBeGreaterThan(0); // change
      expect(Number(crafted.details?.fee)).toBeGreaterThan(0);
    });

    // api.mdx: "Send max tx => crafted tx with max amount" (single output, no change).
    // Uses a Schnorr recipient (a self-send to the Schnorr sender). Kaspa/Ledger addresses are
    // Schnorr, which is the max-send path the wallet actually exercises. NOTE: a max-send to an
    // *ECDSA*-format recipient currently throws "UTXOs can't be determined" — a pre-existing
    // fee-calc mismatch between `calcMaxSpendableAmount` and `selectUtxos` (logic/utxos, shared
    // with the legacy bridge) that only bites when the extra ECDSA mass zeroes out the margin.
    // Tracked separately; the Schnorr path below is the supported one.
    it("crafts a send-max transaction sweeping the funded UTXOs", async () => {
      const crafted = await craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: FUNDED_SENDER,
        recipient: FUNDED_SENDER, // Schnorr (self-send); avoids the ECDSA-recipient edge noted above
        amount: 0n,
        useAllAmount: true,
        asset: { type: "native" },
      });

      const tx = JSON.parse(crafted.transaction);
      expect(tx.inputs.length).toBeGreaterThanOrEqual(1);
      expect(tx.outputs).toHaveLength(1); // sweep → recipient only, no change
      expect(tx.outputs[0].value).toBeGreaterThan(0);
      expect(Number(crafted.details?.fee)).toBeGreaterThan(0);
    });
  });
});
