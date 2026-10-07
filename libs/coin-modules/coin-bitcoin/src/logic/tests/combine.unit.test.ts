import { Psbt, Transaction, address as btcAddress, payments } from "bitcoinjs-lib";
import { combine } from "../combine";
import { PRISTINE_P2PKH } from "./helpers/fixtures";
import { ADDRESSES, PUBLIC_KEY, fundingTransaction, signPsbt } from "./helpers/keys";

/** A PSBT spending outputs of `sender`, as `craftTransaction` crafts it. */
function craft(sender: string, inputs = 1, amount = 9_000): string {
  const spent = btcAddress.toOutputScript(sender);
  const psbt = new Psbt();
  for (let i = 0; i < inputs; i++) {
    const funding = fundingTransaction(spent, 10_000, i);
    psbt.addInput({
      hash: funding.getId(),
      index: 0,
      nonWitnessUtxo: funding.toBuffer(),
      ...(sender === ADDRESSES.legacy ? {} : { witnessUtxo: { script: spent, value: 10_000 } }),
      ...(sender === ADDRESSES.segwit
        ? { redeemScript: payments.p2wpkh({ pubkey: PUBLIC_KEY }).output! }
        : {}),
    });
  }
  psbt.addOutput({ script: btcAddress.toOutputScript(PRISTINE_P2PKH), value: amount });
  return psbt.toBase64();
}

const PUBKEY = PUBLIC_KEY.toString("hex");

describe("combine", () => {
  const crafted = craft(ADDRESSES.nativeSegwit, 2);
  const { reference: signed, signedBase64, signatures } = signPsbt(crafted);

  describe("the whole signed transaction", () => {
    it("returns the signed transaction of a crafted multi-input PSBT", () => {
      expect(combine("bitcoin", crafted, [signed])).toBe(signed);
      expect(combine("bitcoin", crafted, [signed.toUpperCase()])).toBe(signed);
    });

    it("refuses the crafted transaction returned unsigned", () => {
      const unsigned = Transaction.fromBuffer(Psbt.fromBase64(crafted).data.getTransaction());
      expect(() => combine("bitcoin", crafted, [unsigned.toHex()])).toThrow(
        "the transaction is not signed",
      );
    });

    it("refuses a signed transaction that spends or pays something else", () => {
      const { reference: otherAmount } = signPsbt(craft(ADDRESSES.nativeSegwit, 2, 8_000));
      const { reference: otherInputs } = signPsbt(craft(ADDRESSES.nativeSegwit, 1));
      for (const other of [otherAmount, otherInputs]) {
        expect(() => combine("bitcoin", crafted, [other])).toThrow(
          "the signed transaction is not the crafted transaction",
        );
      }
    });
  });

  describe("one signature per input", () => {
    it.each([
      ["legacy", ADDRESSES.legacy, false],
      ["nested SegWit", ADDRESSES.segwit, false],
      ["native SegWit", ADDRESSES.nativeSegwit, false],
      ["Taproot", ADDRESSES.taproot, true],
    ] as const)("assembles the signed %s transaction", (_label, sender, taproot) => {
      const psbt = craft(sender, 2);
      const signer = signPsbt(psbt, taproot);
      expect(combine("bitcoin", psbt, signer.signatures, PUBKEY)).toBe(signer.reference);
    });

    it("needs no public key for Taproot, and one for every other type", () => {
      const taproot = craft(ADDRESSES.taproot, 1);
      const taprootSigner = signPsbt(taproot, true);
      expect(combine("bitcoin", taproot, taprootSigner.signatures)).toBe(taprootSigner.reference);
      expect(() => combine("bitcoin", crafted, signatures)).toThrow(
        "the public key is required to combine signatures",
      );
    });

    it("assembles a single-input transaction from its one signature", () => {
      const single = craft(ADDRESSES.nativeSegwit, 1);
      const signer = signPsbt(single);
      expect(combine("bitcoin", single, signer.signatures, PUBKEY)).toBe(signer.reference);
    });

    it("refuses a public key the spent outputs do not commit to", () => {
      const other = "03" + "11".repeat(32);
      expect(() => combine("bitcoin", crafted, signatures, other)).toThrow(
        "the public key does not match the spent outputs",
      );
    });

    it("refuses a Taproot signature that does not commit to the whole transaction", () => {
      const taproot = craft(ADDRESSES.taproot, 1);
      const [signature] = signPsbt(taproot, true).signatures;
      // 65-byte Schnorr signatures with SIGHASH_ALL pass; NONE (0x02) and ALL|ANYONECANPAY (0x81)
      // would leave the outputs or the inputs open to change.
      expect(() => combine("bitcoin", taproot, [signature + "01"])).not.toThrow();
      for (const sighash of ["02", "81"]) {
        expect(() => combine("bitcoin", taproot, [signature + sighash])).toThrow(
          "signature 0 is not a Schnorr signature of the whole transaction",
        );
      }
    });

    it("refuses a signature that is not of the currency's sighash type", () => {
      // Bitcoin Cash signs with SIGHASH_ALL | SIGHASH_FORKID (0x41), not SIGHASH_ALL (0x01).
      expect(() => combine("bitcoin_cash", crafted, signatures, PUBKEY)).toThrow(
        "signature 0 is not a signature of this currency's sighash type",
      );
      const forkId = signatures.map(signature => signature.slice(0, -2) + "41");
      expect(() => combine("bitcoin_cash", crafted, forkId, PUBKEY)).not.toThrow();
    });
  });

  it("refuses a count that is neither one transaction nor one signature per input", () => {
    expect(() => combine("bitcoin", crafted, [])).toThrow(
      "the signature is not a signed transaction nor input signatures",
    );
    expect(() => combine("bitcoin", crafted, [...signatures, signatures[0]], PUBKEY)).toThrow(
      "expected one signed transaction or 2 input signature(s), got 3 value(s)",
    );
  });

  it("refuses what is neither: a signed PSBT, garbage", () => {
    expect(() => combine("bitcoin", crafted, [signedBase64])).toThrow(
      "the signature is not a signed transaction nor input signatures",
    );
    expect(() => combine("bitcoin", crafted, ["zz"])).toThrow(
      "the signature is not a signed transaction nor input signatures",
    );
    expect(() => combine("bitcoin", crafted, ["3044022011"])).toThrow(
      "expected one signed transaction or 2 input signature(s), got 1 value(s)",
    );
  });
});
