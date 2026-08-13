import { describeTxVersion } from "./tx-version";

describe("describeTxVersion", () => {
  it("reports a V5 transaction", () => {
    // Prefix of the real mainnet fixture tx_0b5baa0c_h3055417:
    // header 0x80000005 (LE 05000080) + V5_VERSION_GROUP_ID 0x26A7270A (LE 0a27a726)
    expect(describeTxVersion("050000800a27a726deadbeef")).toBe("v5 groupId=0x26a7270a");
  });

  it("reports a V6 (Ironwood/NU6.3) transaction", () => {
    // header 0x80000006 (LE 06000080) + V6_VERSION_GROUP_ID 0xD884B698 (LE 98b684d8)
    expect(describeTxVersion("0600008098b684d8deadbeef")).toBe("v6 groupId=0xd884b698");
  });

  it("reports a V4 transaction", () => {
    // Prefix of the real testnet fixture tx_c534920d_h954650:
    // header 0x80000004 (LE 04000080) + V4_VERSION_GROUP_ID 0x892F2085 (LE 85202f89)
    expect(describeTxVersion("0400008085202f89deadbeef")).toBe("v4 groupId=0x892f2085");
  });

  it("reports a pre-overwinter transaction without a version group id", () => {
    // header 0x00000001 (LE 01000000) — overwintered bit clear
    expect(describeTxVersion("0100000000000000deadbeef")).toBe("v1 (pre-overwinter)");
  });

  // The helper annotates logs, including the log written on a failure path, so
  // it must never throw on input that is already known to be malformed.
  it("does not throw on a truncated header", () => {
    expect(describeTxVersion("060000")).toBe("unknown (header truncated)");
    expect(describeTxVersion("")).toBe("unknown (header truncated)");
  });

  it("does not throw on non-hex input", () => {
    expect(describeTxVersion("zzzzzzzzzzzzzzzz")).toBe("unknown (header not hex)");
  });

  // Reporting a version that was not actually read is worse than reporting
  // nothing, because the caller logs this to explain a failure. `parseInt`
  // stops at the first invalid character instead of rejecting, so garbage
  // anywhere but the leading nibble used to parse to a plausible-looking
  // version: "05zz0080…" read as v32768, and a leading "0x" as v80.
  it.each([
    ["garbage in the second byte", "05zz00800a27a726deadbeef"],
    ["garbage in the last header byte", "0500zz800a27a726deadbeef"],
    ["leading whitespace", "  0000800a27a726deadbeef"],
    ["a 0x prefix", "0x050000800a27a726deadbee"],
    ["a signed value", "+50000800a27a726deadbeef"],
  ])("refuses to guess a version from %s", (_case, txHex) => {
    expect(describeTxVersion(txHex)).toBe("unknown (header not hex)");
  });

  it("reports the version but not the group id when only the group id is malformed", () => {
    // Valid V5 header, garbage in the version group id.
    expect(describeTxVersion("05000080zz27a726deadbeef")).toBe("v5 (groupId not hex)");
  });

  it("reports the version when an overwintered header has no group id", () => {
    // A valid V5 header and nothing after it: worth more than "truncated",
    // since the version alone is what the caller is usually chasing.
    expect(describeTxVersion("05000080")).toBe("v5 (groupId truncated)");
  });

  it("accepts uppercase hex", () => {
    expect(describeTxVersion("0600008098B684D8DEADBEEF")).toBe("v6 groupId=0xd884b698");
  });
});
