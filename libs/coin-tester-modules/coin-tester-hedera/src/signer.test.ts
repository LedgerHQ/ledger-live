import { PublicKey } from "@hashgraph/sdk";
import { buildHederaSigner } from "./signer";

describe("buildHederaSigner", () => {
  it("returns a 64-hex-char raw Ed25519 public key (never DER)", async () => {
    const signer = buildHederaSigner();

    const publicKey = await signer.getPublicKey("44/3030");

    expect(publicKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns the same public key on every call (fixed key)", async () => {
    const signer = buildHederaSigner();

    const first = await signer.getPublicKey("44/3030");
    const second = await signer.getPublicKey("44/3030");

    expect(first).toBe(second);
  });

  it("signs the exact body bytes handed to it, with no prefix or re-encoding", async () => {
    const signer = buildHederaSigner();
    const publicKeyHex = await signer.getPublicKey("44/3030");
    const bodyBytes = new Uint8Array([1, 2, 3, 4, 5]);

    const signature = await signer.signTransaction(bodyBytes);

    const verified = PublicKey.fromString(publicKeyHex).verify(bodyBytes, signature);

    expect(verified).toBe(true);
  });
});
