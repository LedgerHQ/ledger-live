import { buildLiveAppModalURL } from "./url";
import * as registry from "./registry";

describe("buildLiveAppModalURL", () => {
  beforeEach(() => {
    registry.__resetForTests();
  });

  it("builds a URL with manifest, path, inputs, and protocol-reserved params", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/page",
      requestId: "req-1",
      inputs: { theme: "light", lang: "en" },
    });

    expect(result).toBeDefined();
    const url = new URL(result!);
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/page");
    expect(url.searchParams.get("theme")).toBe("light");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("isLiveAppModal")).toBe("true");
    expect(url.searchParams.get("liveAppModalRequestId")).toBe("req-1");
  });

  it("resolves a relative path against the manifest URL's directory", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app/",
      path: "subpage",
      requestId: "req-1",
      inputs: {},
    });

    const url = new URL(result!);
    expect(url.pathname).toBe("/app/subpage");
  });

  it("uses an absolute path verbatim regardless of the manifest path", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app/nested/",
      path: "/root-page",
      requestId: "req-1",
      inputs: {},
    });

    const url = new URL(result!);
    expect(url.pathname).toBe("/root-page");
  });

  it("preserves query string and hash from the path", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/page?source=cta#section",
      requestId: "req-1",
      inputs: { theme: "dark" },
    });

    const url = new URL(result!);
    expect(url.pathname).toBe("/page");
    expect(url.searchParams.get("source")).toBe("cta");
    expect(url.searchParams.get("theme")).toBe("dark");
    expect(url.hash).toBe("#section");
  });

  it("skips undefined input values", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/",
      requestId: "req-1",
      inputs: { theme: "light", lang: undefined },
    });

    const url = new URL(result!);
    expect(url.searchParams.has("lang")).toBe(false);
    expect(url.searchParams.get("theme")).toBe("light");
  });

  it("inlines the registry payload as liveAppModalInitialPayload when small enough", () => {
    const { requestId } = registry.createRequest({ payload: { foo: "bar" } });

    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/",
      requestId,
      inputs: {},
    });

    const url = new URL(result!);
    const inlined = url.searchParams.get("liveAppModalInitialPayload");
    expect(inlined).not.toBeNull();
    expect(JSON.parse(inlined!)).toEqual({ foo: "bar" });
  });

  it("omits the inlined payload when the encoded URL would exceed the safe limit", () => {
    // The raw JSON is well under the 16,000-char raw cap, but the encoded form
    // (every quote becomes %22, every brace becomes %7B/%7D, etc.) inflates the
    // URL well past it. The previous `serialized.length` check would have let
    // this pass; the encoded-URL check rejects it.
    const heavyPayload = {
      blob: '"'.repeat(6_000) + "{}".repeat(1_000),
    };
    const { requestId } = registry.createRequest({ payload: heavyPayload });

    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/",
      requestId,
      inputs: {},
    });

    expect(result).toBeDefined();
    const url = new URL(result!);
    expect(url.searchParams.has("liveAppModalInitialPayload")).toBe(false);
    // Other params still present so the child can recover via getInitialPayload
    expect(url.searchParams.get("liveAppModalRequestId")).toBe(requestId);
  });

  it("returns undefined when the manifest URL is invalid", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "not-a-url",
      path: "/",
      requestId: "req-1",
      inputs: {},
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when path is a fully-qualified URL on a different origin", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "https://evil.com/phish",
      requestId: "req-1",
      inputs: {},
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when path uses a non-http scheme", () => {
    for (const path of ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,foo"]) {
      const result = buildLiveAppModalURL({
        manifestURL: "https://example.com/app",
        path,
        requestId: "req-1",
        inputs: {},
      });

      expect(result).toBeUndefined();
    }
  });

  it("accepts a fully-qualified URL on the same origin as the manifest", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "https://example.com/page",
      requestId: "req-1",
      inputs: {},
    });

    const url = new URL(result!);
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/page");
  });

  it("does not inline a payload when none is registered", () => {
    const result = buildLiveAppModalURL({
      manifestURL: "https://example.com/app",
      path: "/",
      requestId: "no-such-request",
      inputs: {},
    });

    const url = new URL(result!);
    expect(url.searchParams.has("liveAppModalInitialPayload")).toBe(false);
  });
});
