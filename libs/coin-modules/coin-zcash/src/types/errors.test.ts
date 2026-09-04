import {
  ZcashAmountBelowDustThreshold,
  ZcashNotesNotYetSpendable,
  ZcashSaplingRecipientNotSupported,
  ZcashSendTooLarge,
  ZcashShieldedKeyMissing,
  ZcashSignerNotSupported,
  ZcashSigningCancelled,
  ZcashUtxoNotInAccount,
} from "./errors";
import { TRANSPARENT_OUTPUT_DUST_THRESHOLD } from "../logic/coin-selection";

// Ledger Live renders an error through its `name`, so that is what the UI and
// the callers branch on -- not the message.
describe("zcash errors", () => {
  it.each([
    [ZcashSaplingRecipientNotSupported, "Sapling recipients are not supported"],
    [ZcashSignerNotSupported, "Signer does not support Zcash PCZT signing"],
    [ZcashSigningCancelled, "Zcash signing was cancelled"],
    [ZcashNotesNotYetSpendable, "These funds are not spendable yet, try again in a few minutes"],
    [
      ZcashShieldedKeyMissing,
      "Activate your private balance first: this transfer needs the viewing key from your device",
    ],
    [
      ZcashAmountBelowDustThreshold,
      `Amount is too small to be broadcast (minimum ${TRANSPARENT_OUTPUT_DUST_THRESHOLD} zatoshis)`,
    ],
    [
      ZcashSendTooLarge,
      "This amount is too large to send in one transaction: try sending it in smaller amounts",
    ],
  ])("names %p and gives it a readable default message", (Err, message) => {
    const error = new Err();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(Err.name);
    expect(error.message).toBe(message);
    expect(new Err("something else").message).toBe("something else");
  });

  it("carries the offending outpoint on an unmappable coin", () => {
    const error = new ZcashUtxoNotInAccount("please re-sync", { txid: "ab".repeat(32), vout: 3 });

    expect(error.name).toBe("ZcashUtxoNotInAccount");
    expect(error).toMatchObject({ message: "please re-sync", txid: "ab".repeat(32), vout: 3 });
  });

  it("can be raised without an outpoint, and then carries none", () => {
    const error = new ZcashUtxoNotInAccount("please re-sync");

    expect({ txid: error.txid, vout: error.vout }).toEqual({ txid: undefined, vout: undefined });
    expect(error.message).toBe("please re-sync");
  });

  it("carries the network's dust threshold", () => {
    expect(new ZcashAmountBelowDustThreshold().minimumZatoshis).toBe(
      TRANSPARENT_OUTPUT_DUST_THRESHOLD,
    );
  });
});
