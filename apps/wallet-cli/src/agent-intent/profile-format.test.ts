import { describe, it, expect } from "bun:test";
import { redactUrlCredentials, agentIntentProfileStatus } from "./profile-format";

describe("redactUrlCredentials", () => {
  it("strips userinfo from a URL", () => {
    expect(redactUrlCredentials("https://user:pass@example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("passes a URL with no userinfo through completely unchanged (no normalization)", () => {
    expect(redactUrlCredentials("https://example.com")).toBe("https://example.com");
  });

  it("passes a non-URL string through unchanged (catch branch)", () => {
    expect(redactUrlCredentials("not a url")).toBe("not a url");
  });
});

describe("agentIntentProfileStatus", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("is enrolled once a trustchainId is set, regardless of expiry", () => {
    expect(
      agentIntentProfileStatus(
        { trustchainId: "tc-1", enrollmentExpiresAt: "2020-01-01T00:00:00.000Z" },
        now,
      ),
    ).toBe("enrolled");
  });

  it("is pending before enrollmentExpiresAt with no trustchainId", () => {
    expect(agentIntentProfileStatus({ enrollmentExpiresAt: "2026-01-02T00:00:00.000Z" }, now)).toBe(
      "pending",
    );
  });

  it("is expired past enrollmentExpiresAt with no trustchainId", () => {
    expect(agentIntentProfileStatus({ enrollmentExpiresAt: "2025-12-31T00:00:00.000Z" }, now)).toBe(
      "expired",
    );
  });
});
