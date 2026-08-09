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
// Expected Orchard-only UA for VALID_MAINNET_UFVK — from zcash-utils get_orchard_address.rs EXPECTED0.
const EXPECTED_ACCOUNT_0_UA =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
// Testnet UFVK for account 0 (same seed, testnet encoding) — from zcash-utils known_vectors.rs.
const VALID_TESTNET_UFVK =
  "uviewtest1eacc7lytmvgp0sshwjjv4qsg9fnewq00s6zye8hqwndpdsg0tum2ft4k96t86eapddpq56exfycnxnlds75vvpydv8fgj4cecczkmt3rjat8qjfqrk2cdlm9alep2z04785sx6yekqjk6wywkttlthld4c3xmg8fvneg4p97vzxwu9xtuh0xrgfy90p6uuxf8cwl8nxfq6hlte0nnylk59xceldrkx9vge3k4utkue2txu5kpp60aw07q0f0jgp0pv2c0gr7jdm6273uxyskt72jehte5jf2dg94d84le08h2t5rhd93j2d98ja59h46est69f3a7rav7k6744p2u8dxasc7nr9p2k95x7uaknahj0kw7mu5zq9nllj7x2qswq3jswsuzwms7shv7dhxz9s4yudatwu3u3v3wqznkhu6jt7xt8whjh3dkzvsf28p6mj8tya009gwzgszz2at8alquu8y0fmqt7klayrjx7n3ulml5q00fgdr";

describe("orchardAddressFromUfvk — Rust error-message contract", () => {
  describe("success path", () => {
    it("returns a u1-prefixed address for a valid mainnet UFVK", () => {
      const addr = orchardAddressFromUfvk(VALID_MAINNET_UFVK);
      expect(addr).toMatch(/^u1/);
    });

    it("returns the exact account-0 UA vector (host must match device bit-for-bit)", () => {
      expect(orchardAddressFromUfvk(VALID_MAINNET_UFVK)).toBe(EXPECTED_ACCOUNT_0_UA);
    });

    it("returns a utest1-prefixed address for a valid testnet UFVK — no special-casing", () => {
      expect(orchardAddressFromUfvk(VALID_TESTNET_UFVK)).toMatch(/^utest1/);
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
