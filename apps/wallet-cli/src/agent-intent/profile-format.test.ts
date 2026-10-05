import { describe, it, expect } from "bun:test";
import {
  redactUrlCredentials,
  hasUrlCredentials,
  agentIntentProfileStatus,
  formatInvalidAgentIntentProfilesWarning,
} from "./profile-format";

const PLAIN_URL = "https://example.com";
const TRUNCATED_CREDENTIAL_URL = "https://user:secret@";

describe("redactUrlCredentials", () => {
  it("strips userinfo from a URL", () => {
    expect(redactUrlCredentials("https://user:pass@example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("passes a URL with no userinfo through completely unchanged (no normalization)", () => {
    expect(redactUrlCredentials(PLAIN_URL)).toBe(PLAIN_URL);
  });

  it("passes a non-URL string through unchanged (catch branch)", () => {
    expect(redactUrlCredentials("not a url")).toBe("not a url");
  });

  it("still strips userinfo from a value new URL() rejects outright (truncated, no host)", () => {
    // `new URL(TRUNCATED_CREDENTIAL_URL)` throws — WHATWG requires a host — but the credential is
    // still right there in the string, so the catch branch must not return it unchanged.
    expect(redactUrlCredentials(TRUNCATED_CREDENTIAL_URL)).toBe("https://");
  });

  it("strips userinfo containing a slash from a value new URL() rejects", () => {
    expect(redactUrlCredentials("https://user:secret/path@host")).toBe("https://host");
  });
});

describe("hasUrlCredentials", () => {
  it("is true for a URL with both a username and a password", () => {
    expect(hasUrlCredentials("https://user:pass@example.com")).toBe(true);
  });

  it("is true for a URL with only a username", () => {
    expect(hasUrlCredentials("https://user@example.com")).toBe(true);
  });

  it("is false for a URL with no userinfo", () => {
    expect(hasUrlCredentials("https://example.com/agent-intent")).toBe(false);
  });

  it("is false for a non-URL string (not this function's job to flag)", () => {
    expect(hasUrlCredentials("not a url")).toBe(false);
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

  it("is recovering while an enrolled profile has an unexpired recovery marker", () => {
    expect(
      agentIntentProfileStatus(
        {
          trustchainId: "tc-1",
          enrollmentExpiresAt: "2020-01-01T00:00:00.000Z",
          pendingRecovery: { expiresAt: "2026-01-02T00:00:00.000Z" },
        },
        now,
      ),
    ).toBe("recovering");
  });

  it("is enrolled again once the recovery marker has expired", () => {
    expect(
      agentIntentProfileStatus(
        {
          trustchainId: "tc-1",
          enrollmentExpiresAt: "2020-01-01T00:00:00.000Z",
          pendingRecovery: { expiresAt: "2025-12-31T00:00:00.000Z" },
        },
        now,
      ),
    ).toBe("enrolled");
  });
});

describe("formatInvalidAgentIntentProfilesWarning", () => {
  it("is undefined when there's nothing to warn about", () => {
    expect(formatInvalidAgentIntentProfilesWarning([])).toBeUndefined();
  });

  it("names every id and says the record is kept but ignored until fixed", () => {
    const warning = formatInvalidAgentIntentProfilesWarning(["broken-1", "broken-2"]);
    expect(warning).toContain("broken-1, broken-2");
    expect(warning).toContain("kept as-is");
    expect(warning).toContain("ignored until it is fixed");
  });
});
