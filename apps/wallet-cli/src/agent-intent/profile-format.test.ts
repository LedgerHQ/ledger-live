import { describe, it, expect } from "bun:test";
import {
  redactUrlCredentials,
  hasUrlCredentials,
  agentIntentProfileStatus,
  formatInvalidAgentIntentProfilesWarning,
} from "./profile-format";

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

  it("still strips userinfo from a value new URL() rejects outright (truncated, no host)", () => {
    // `new URL("https://user:secret@")` throws — WHATWG requires a host — but the credential is
    // still right there in the string, so the catch branch must not return it unchanged.
    expect(redactUrlCredentials("https://user:secret@")).toBe("https://");
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
});

describe("formatInvalidAgentIntentProfilesWarning", () => {
  it("is undefined when there's nothing to warn about", () => {
    expect(formatInvalidAgentIntentProfilesWarning([])).toBeUndefined();
  });

  it("names every id and says the record isn't gone yet but will be dropped on next write", () => {
    const warning = formatInvalidAgentIntentProfilesWarning(["broken-1", "broken-2"]);
    expect(warning).toContain("broken-1, broken-2");
    expect(warning).toContain("still on disk");
    expect(warning).toContain("dropped the next time any command saves the session");
  });
});
