import * as asn1 from "asn1.js";

const ECDSASignature = asn1.define("ECDSASignature", function () {
  this.seq().obj(this.key("r").int(), this.key("s").int());
});

// Tested in Exchange.integ.test.ts
export function signatureImport(sig: Uint8Array): Buffer {
  try {
    const decoded = ECDSASignature.decode(sig, "der");

    const rBigInt = decoded.r;
    const sBigInt = decoded.s;

    let rHex = rBigInt.toString(16);
    let sHex = sBigInt.toString(16);

    rHex = rHex.padStart(64, "0");
    sHex = sHex.padStart(64, "0");

    const r = new Uint8Array(32);
    const s = new Uint8Array(32);

    for (let i = 0; i < 32; i++) {
      r[i] = parseInt(rHex.substr(i * 2, 2), 16);
      s[i] = parseInt(sHex.substr(i * 2, 2), 16);
    }

    const signature64 = new Uint8Array(64);
    signature64.set(r, 0);
    signature64.set(s, 32);

    return Buffer.from(signature64);
  } catch (error) {
    throw new Error(`Failed to import DER signature: ${error}`);
  }
}

// Tested in Exchange.integ.test.ts
export function signatureExport(sig: Uint8Array): Buffer {
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
