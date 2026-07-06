import { isValidKaspaAddress } from "./kaspaAddresses";
import { craftTransaction } from "./craftTransaction";

const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

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

  // FIXME: requires a maintained real Kaspa address (with a known xprv/signer, or at minimum a
  // known spendable UTXO set) to craft a real send / send-max transaction end to end. No such
  // fixture could be verified from this environment (no network access to the Kaspa endpoint) —
  // enable once a funded sender fixture is confirmed against api.mdx's expectations.
  describe.skip("funded sender", () => {
    it("crafts a transaction matching the requested amount and recipient", () => {
      throw new Error("FIXME: supply a verified funded kaspa: sender fixture");
    });

    it("crafts a send-max transaction with the max spendable amount", () => {
      throw new Error("FIXME: supply a verified funded kaspa: sender fixture");
    });
  });
});
