import { QScheme, QSCHEMES } from "./schemes";
import {
  encodeQSignature,
  decodeQSignature,
  compactEncode,
  compactDecode,
} from "./qsignature";

const fill = (n: number, seed: number) => {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = (i * seed + 7) & 0xff;
  return a;
};

describe("SCALE compact codec", () => {
  it.each([0, 1, 63, 64, 754, 2420, 7856, 16383, 16384, 1000000])("round-trips %i", n => {
    const [v, used] = compactDecode(compactEncode(n));
    expect(v).toBe(n);
    expect(used).toBe(compactEncode(n).length);
  });
});

describe("QSignature envelope codec", () => {
  for (const scheme of Object.values(QScheme)) {
    const p = QSCHEMES[scheme];
    it(`round-trips ${p.label} (variant ${p.variant}, pk ${p.publicKeyLength})`, () => {
      const env = {
        scheme,
        signature: fill(p.maxSignatureLength, p.variant + 1),
        publicKey: fill(p.publicKeyLength, p.variant + 13),
      };
      const bytes = encodeQSignature(env);
      // first byte is the SCALE enum variant
      expect(bytes[0]).toBe(p.variant);
      const back = decodeQSignature(bytes);
      expect(back.scheme).toBe(scheme);
      expect(Array.from(back.signature)).toEqual(Array.from(env.signature));
      expect(Array.from(back.publicKey)).toEqual(Array.from(env.publicKey));
    });
  }

  it("rejects a wrong-length public key", () => {
    expect(() =>
      encodeQSignature({
        scheme: QScheme.DILITHIUM,
        signature: new Uint8Array(10),
        publicKey: new Uint8Array(100),
      }),
    ).toThrow();
  });
});
