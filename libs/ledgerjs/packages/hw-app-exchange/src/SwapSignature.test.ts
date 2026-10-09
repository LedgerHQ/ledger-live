import { createHash } from "node:crypto";
import { secp256k1 } from "@noble/curves/secp256k1";
import { p256 } from "@noble/curves/nist";
import { classifySwapNgSignature, isValidSwapNgPartnerPublicKey } from "./SwapSignature";

const CURVES = { secp256k1, secp256r1: p256 };
// Deterministic test key, never used outside of these fixtures.
const PRIVATE_KEY = Uint8Array.from(Buffer.alloc(32, 0x11));
const PAYLOAD = "CgNCVEM";

const base64url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe.each(["secp256k1", "secp256r1"] as const)("classifySwapNgSignature on %s", curve => {
  const publicKey = {
    curve,
    data: Uint8Array.from(CURVES[curve].getPublicKey(PRIVATE_KEY, false)),
  };

  it('returns "valid" for a signature over "." + payload', () => {
    const digest = createHash("sha256").update(`.${PAYLOAD}`).digest();
    const signature = CURVES[curve]
      .sign(Uint8Array.from(digest), PRIVATE_KEY, { lowS: false, prehash: false })
      .toBytes("compact");

    expect(classifySwapNgSignature(PAYLOAD, base64url(signature), publicKey)).toMatch(/^valid/);
  });

  // noble throws for r or s equal to 0 or not below the curve order.
  it.each([
    ["r = s = 0", new Uint8Array(64)],
    ["r, s >= n", new Uint8Array(64).fill(0xff)],
    ["r = 0 only", Uint8Array.from([...new Uint8Array(32), ...new Uint8Array(32).fill(0x01)])],
  ])('returns "signature_malformed" without throwing for %s', (_case, signature) => {
    let classification: string | undefined;
    expect(() => {
      classification = classifySwapNgSignature(PAYLOAD, base64url(signature), publicKey);
    }).not.toThrow();

    expect(classification).toBe("signature_malformed");
  });

  it('returns "signature_malformed" for a signature that is not 64 bytes', () => {
    expect(classifySwapNgSignature(PAYLOAD, base64url(new Uint8Array(63)), publicKey)).toBe(
      "signature_malformed",
    );
  });
});

// A curve outside of the TypeScript union, as CAL JSON or a JS caller could provide it.
const UNSUPPORTED_CURVE: { curve: "secp256k1" } = JSON.parse('{ "curve": "secp384r1" }');

describe("unsupported curve", () => {
  const digest = createHash("sha256").update(`.${PAYLOAD}`).digest();
  const signature = base64url(
    secp256k1
      .sign(Uint8Array.from(digest), PRIVATE_KEY, { lowS: false, prehash: false })
      .toBytes("compact"),
  );
  const publicKey = {
    ...UNSUPPORTED_CURVE,
    data: Uint8Array.from(secp256k1.getPublicKey(PRIVATE_KEY, false)),
  };

  it("does not fall back to secp256k1", () => {
    expect(isValidSwapNgPartnerPublicKey(publicKey)).toBe(false);
    expect(classifySwapNgSignature(PAYLOAD, signature, publicKey)).toBe("signature_malformed");
  });
});
