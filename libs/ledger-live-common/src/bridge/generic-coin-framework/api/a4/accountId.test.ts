import { computeA4AccountVersion, deriveA4AccountId } from "./accountId";

describe("deriveA4AccountId", () => {
  it("is deterministic for the same input", () => {
    const a = deriveA4AccountId("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    const b = deriveA4AccountId("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    expect(a).toBe(b);
  });

  it("is case-insensitive on EVM hex addresses (EIP-55 checksum vs lowercase)", () => {
    const checksum = deriveA4AccountId(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    );
    const lower = deriveA4AccountId(
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    );
    expect(checksum).toBe(lower);
  });

  it("preserves case for Bitcoin xpubs (base58 is case-sensitive)", () => {
    // Two xpubs differing only in case are different keys → different A4 accounts.
    const xpub =
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
    const a = deriveA4AccountId(xpub);
    const b = deriveA4AccountId(xpub.toLowerCase());
    expect(a).not.toBe(b);
  });

  it("differs across addresses and does not fold the network in", () => {
    expect(deriveA4AccountId("0xabc")).not.toBe(deriveA4AccountId("0xdef"));
  });

  it("has a UUID shape", () => {
    const id = deriveA4AccountId("0xabc");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("computeA4AccountVersion", () => {
  it("is order-independent (addresses are sorted before hashing)", () => {
    expect(computeA4AccountVersion(["b", "a", "c"])).toBe(
      computeA4AccountVersion(["a", "b", "c"]),
    );
  });

  it("changes when the address set changes", () => {
    expect(computeA4AccountVersion(["a"])).not.toBe(
      computeA4AccountVersion(["a", "b"]),
    );
  });

  it("is a 64-char sha256 hex digest", () => {
    expect(computeA4AccountVersion(["a"])).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches the A4 backend algorithm byte-for-byte (sorted, joined with '|', sha256 hex)", () => {
    // Golden vector: sha256(utf8("a|b")), mirroring the Scala `fromSeq` reference. This guards
    // against any drift (normalization, separator, encoding) from the server's definition.
    expect(computeA4AccountVersion(["b", "a"])).toBe(
      "0eab8a0a3380abf4c7d1fb0b43b66aafbb64a4b953e4eb2dccca579461912d0c",
    );
  });

  it("hashes address values verbatim — no normalization (the server does not normalize either)", () => {
    // Callers normalize once at the boundary (addressesFor); the version function itself is
    // case-sensitive so it always matches whatever string was registered server-side.
    expect(computeA4AccountVersion(["0xABC"])).not.toBe(
      computeA4AccountVersion(["0xabc"]),
    );
  });
});
