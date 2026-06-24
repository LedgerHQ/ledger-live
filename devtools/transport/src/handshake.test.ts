import { identityToQuery, identityUrl, parseIdentity } from "./handshake";
import type { Identity } from "./handshake";

describe("identityToQuery", () => {
  it("should encode role and id for a host", () => {
    const result = identityToQuery({ role: "host", id: "app" });
    expect(new URLSearchParams(result).get("role")).toBe("host");
    expect(new URLSearchParams(result).get("id")).toBe("app");
    expect(new URLSearchParams(result).get("target")).toBeNull();
  });

  it("should include target when provided", () => {
    const result = identityToQuery({ role: "tool", id: "web-tools", target: "app" });
    expect(new URLSearchParams(result).get("target")).toBe("app");
  });

  it("should omit target when undefined", () => {
    const result = identityToQuery({ role: "tool", id: "web-tools" });
    expect(new URLSearchParams(result).has("target")).toBe(false);
  });

  it("should percent-encode special characters in id", () => {
    const result = identityToQuery({ role: "host", id: "my app" });
    expect(new URLSearchParams(result).get("id")).toBe("my app");
  });
});

describe("identityUrl", () => {
  it("should append query string with ? when base URL has none", () => {
    const url = identityUrl("ws://localhost:8080", { role: "host", id: "app" });
    expect(url).toMatch(/^ws:\/\/localhost:8080\?/);
    const qs = url.split("?")[1];
    expect(new URLSearchParams(qs).get("role")).toBe("host");
  });

  it("should append with & when base URL already has a query string", () => {
    const url = identityUrl("ws://localhost:8080?foo=bar", {
      role: "tool",
      id: "dev",
      target: "app",
    });
    expect(url).toMatch(/^ws:\/\/localhost:8080\?foo=bar&/);
  });

  it("should include target in the final URL", () => {
    const url = identityUrl("ws://localhost", { role: "tool", id: "dev", target: "app" });
    const qs = url.split("?")[1];
    expect(new URLSearchParams(qs).get("target")).toBe("app");
  });
});

describe("parseIdentity", () => {
  it("should parse a valid host URL", () => {
    const result = parseIdentity("/?role=host&id=app");
    expect(result).toEqual({ role: "host", id: "app", target: undefined });
  });

  it("should parse a valid tool URL with target", () => {
    const result = parseIdentity("/?role=tool&id=web-tools&target=app");
    expect(result).toEqual({ role: "tool", id: "web-tools", target: "app" });
  });

  it("should return undefined when role is missing", () => {
    expect(parseIdentity("/?id=app")).toBeUndefined();
  });

  it("should return undefined when id is missing", () => {
    expect(parseIdentity("/?role=host")).toBeUndefined();
  });

  it("should return undefined when role is invalid", () => {
    expect(parseIdentity("/?role=admin&id=app")).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(parseIdentity(undefined)).toBeUndefined();
  });

  it("should return undefined for an empty string", () => {
    expect(parseIdentity("")).toBeUndefined();
  });

  it("should handle a URL with no query string", () => {
    expect(parseIdentity("/")).toBeUndefined();
  });

  it("should round-trip through identityToQuery", () => {
    const identity: Identity = { role: "tool", id: "web-tools", target: "app" };
    const qs = `/?${identityToQuery(identity)}`;
    expect(parseIdentity(qs)).toEqual(identity);
  });
});
