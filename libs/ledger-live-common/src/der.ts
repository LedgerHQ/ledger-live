import * as asn1 from "asn1.js";

// From libs/ledgerjs/packages/hw-app-exchange/src/DerUtils.ts
export function signatureExport(sig: Uint8Array): Buffer {
  const ECDSASignature = asn1.define("ECDSASignature", function () {
    this.seq().obj(this.key("r").int(), this.key("s").int());
  });

  if (sig.length !== 64) {
    throw new Error("Signature must be exactly 64 bytes");
  }

  const r = sig.slice(0, 32);
  const s = sig.slice(32, 64);

  const rBigInt = BigInt(
    "0x" +
      Array.from(r)
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""),
  );
  const sBigInt = BigInt(
    "0x" +
      Array.from(s)
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""),
  );

  const sigObject = {
    r: rBigInt,
    s: sBigInt,
  };

  try {
    const derEncoded = ECDSASignature.encode(sigObject, "der");
    return Buffer.from(new Uint8Array(derEncoded));
  } catch (error) {
    throw new Error(`Failed to encode signature to DER: ${error}`);
  }
}
