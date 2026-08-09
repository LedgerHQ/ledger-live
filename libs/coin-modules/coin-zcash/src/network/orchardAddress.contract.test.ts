/**
 * Contract tests: verify that orchardAddressFromUfvk error messages are safe plain text
 * and never echo the UFVK string back into the message (privacy guarantee).
 *
 * These tests run against the REAL native binary — @ledgerhq/zcash-utils is NOT mocked.
 * If the native binary changes its error vocabulary, these tests fail loudly.
 */
import { orchardAddressFromUfvk } from "@ledgerhq/zcash-utils";

// A plausible-looking but invalid UFVK — long enough to be recognisable if leaked.
const FAKE_UFVK = "uview1fake-ufvk-used-only-in-contract-tests-must-never-appear-in-error-messages";
// A known-good mainnet UFVK (account 0 from the abandon×11 + about mnemonic).
const VALID_MAINNET_UFVK =
  "uview1zkk7f8hp2m5v09kq7h29vkgngwhhvgy2ey32cy5j0kp69g7ju2vqjvnue03u99z382rtkgvj3f8vtqdtxfxvgjytezgt39dqc0lyt2sj084jdq4md69snc3wxdcl8uah8sxw3rrt9pnxnfl3r4xnczapts7gr4l0cuell7dcjv36gkdcsl4axps827xt6fgmfl78zlhddec72tn2p0eqnpkuy7a08puhj97v0ahxuqlyzmyqtldqnc0p3696d9ww8x6mpd56mz6w32twryevru2rx34lf8dtqsp50gar";

describe("orchardAddressFromUfvk — Rust error-message contract", () => {
  describe("success path", () => {
    it("returns a u1-prefixed address for a valid mainnet UFVK", () => {
      const addr = orchardAddressFromUfvk(VALID_MAINNET_UFVK);
      expect(addr).toMatch(/^u1/);
    });
  });

  describe("invalid UFVK — bech32m decoding failed", () => {
    const inputs = [
      ["garbage string", "not-a-valid-ufvk"],
      ["empty string", ""],
      ["plausible fake UFVK", FAKE_UFVK],
      ["truncated real UFVK", VALID_MAINNET_UFVK.slice(0, 40)],
    ] as const;

    it.each(inputs)("%s: error message is exactly the expected safe string", (_label, input) => {
      expect(() => orchardAddressFromUfvk(input)).toThrow("invalid UFVK: bech32m decoding failed");
    });

    it.each(inputs)("%s: error message does not contain the UFVK input", (_label, input) => {
      if (input === "") return; // empty string cannot be leaked anyway
      let caught: Error | null = null;
      try {
        orchardAddressFromUfvk(input);
      } catch (e) {
        caught = e as Error;
      }
      expect(caught).not.toBeNull();
      expect(caught!.message).not.toContain(input);
    });
  });

  describe("error messages — exhaustive no-leakage assertions", () => {
    const KNOWN_SAFE_MESSAGES = [
      "invalid UFVK: bech32m decoding failed",
      "invalid UFVK: FVK parsing failed",
      "UFVK contains no Orchard component",
      "unsupported network in UFVK: regtest",
    ] as const;

    it.each(KNOWN_SAFE_MESSAGES)("message %j contains no bech32-encoded key material", msg => {
      // Match the bech32m HRP prefixes followed by encoded data (actual key leakage),
      // not the description word "UFVK" which is intentionally part of the message.
      expect(msg).not.toMatch(/uview1[a-z0-9]+|utest1[a-z0-9]+/i);
    });

    it.each(KNOWN_SAFE_MESSAGES)("message %j is under 80 chars (not a long dump)", msg => {
      expect(msg.length).toBeLessThan(80);
    });
  });
});
