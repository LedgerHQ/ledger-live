import { describe, expect, it } from "@jest/globals";
import {
  WEBVIEW_GUEST_CSP,
  createLiveAppSchemeChecker,
  mergeCspHeaders,
} from "./webviewHandlers.helpers";

describe("createLiveAppSchemeChecker", () => {
  const isAllowed = createLiveAppSchemeChecker(["ledgerlive", "ledgerwallet"]);

  describe("allowed schemes", () => {
    it.each([
      ["https://example.com"],
      ["https://app.example.com/path?q=1"],
      ["http://localhost:3000"],
      ["about:blank"],
      ["ledgerlive://discover"],
      ["ledgerwallet://deeplink"],
    ])("allows %s", url => {
      expect(isAllowed(url)).toBe(true);
    });
  });

  describe("blocked schemes", () => {
    it.each([
      ["itms-apps://itunes.apple.com/app/id1234"],
      ["ms-word://open?file=..."],
      ["ms-notepad://"],
      ["ms-paint://"],
      ["file:///etc/passwd"],
      ["javascript:alert(1)"],
      ["mailto:foo@bar.com"],
      ["ftp://example.com"],
      ["data:text/html,<h1>hi</h1>"],
      ["blob:https://example.com/abc-123"],
    ])("blocks %s", url => {
      expect(isAllowed(url)).toBe(false);
    });
  });

  describe("malformed input", () => {
    it.each([[""], ["not a url"], ["://missing-scheme"], ["https:/"]])(
      "rejects malformed input %j",
      url => {
        expect(isAllowed(url)).toBe(false);
      },
    );
  });

  it("respects the supportedSchemes argument", () => {
    const noDeepLinks = createLiveAppSchemeChecker([]);
    expect(noDeepLinks("ledgerlive://discover")).toBe(false);
    expect(noDeepLinks("https://example.com")).toBe(true);

    const custom = createLiveAppSchemeChecker(["myscheme"]);
    expect(custom("myscheme://foo")).toBe(true);
    expect(custom("ledgerlive://discover")).toBe(false);
  });
});

describe("mergeCspHeaders", () => {
  const INJECTED = "frame-src 'self' https:;";

  it("sets our CSP when no Content-Security-Policy header exists", () => {
    const merged = mergeCspHeaders(
      {
        "Content-Type": ["text/html"],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy"]).toEqual([INJECTED]);
    expect(merged["Content-Type"]).toEqual(["text/html"]);
  });

  it("handles an undefined responseHeaders argument", () => {
    const merged = mergeCspHeaders(undefined, INJECTED);
    expect(merged["Content-Security-Policy"]).toEqual([INJECTED]);
  });

  it("appends to an existing Content-Security-Policy header (canonical casing)", () => {
    const original = "default-src 'self'";
    const merged = mergeCspHeaders(
      {
        "Content-Security-Policy": [original],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy"]).toEqual([original, INJECTED]);
  });

  it("normalises lowercase content-security-policy to the canonical key", () => {
    const original = "default-src 'self'";
    const merged = mergeCspHeaders(
      {
        "content-security-policy": [original],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy"]).toEqual([original, INJECTED]);
    expect(merged["content-security-policy"]).toBeUndefined();
  });

  it("normalises mixed-case CoNtEnT-SeCuRiTy-PoLiCy to the canonical key", () => {
    const original = "default-src 'self'";
    const merged = mergeCspHeaders(
      {
        "CoNtEnT-SeCuRiTy-PoLiCy": [original],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy"]).toEqual([original, INJECTED]);
    expect(merged["CoNtEnT-SeCuRiTy-PoLiCy"]).toBeUndefined();
  });

  it("preserves multiple existing CSP values when appending", () => {
    const merged = mergeCspHeaders(
      {
        "Content-Security-Policy": ["default-src 'self'", "script-src 'self'"],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy"]).toEqual([
      "default-src 'self'",
      "script-src 'self'",
      INJECTED,
    ]);
  });

  it("leaves Content-Security-Policy-Report-Only untouched", () => {
    const merged = mergeCspHeaders(
      {
        "Content-Security-Policy-Report-Only": ["default-src 'self'"],
      },
      INJECTED,
    );

    expect(merged["Content-Security-Policy-Report-Only"]).toEqual(["default-src 'self'"]);
    expect(merged["Content-Security-Policy"]).toEqual([INJECTED]);
  });

  it("does not mutate the input headers object", () => {
    const input = {
      "Content-Security-Policy": ["default-src 'self'"],
      "Content-Type": ["text/html"],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    mergeCspHeaders(input, INJECTED);

    expect(input).toEqual(snapshot);
  });
});

describe("WEBVIEW_GUEST_CSP", () => {
  it("contains frame-src, child-src and form-action directives", () => {
    expect(WEBVIEW_GUEST_CSP).toContain("frame-src");
    expect(WEBVIEW_GUEST_CSP).toContain("child-src");
    expect(WEBVIEW_GUEST_CSP).toContain("form-action");
  });

  it("allows blob sources for SDK-loaded web workers or frames", () => {
    expect(WEBVIEW_GUEST_CSP).toContain("frame-src 'self' http: https: blob:;");
    expect(WEBVIEW_GUEST_CSP).toContain("child-src 'self' http: https: blob:;");
  });

  it("does not allow the app-store / office external protocol schemes", () => {
    expect(WEBVIEW_GUEST_CSP).not.toContain("itms-apps");
    expect(WEBVIEW_GUEST_CSP).not.toContain("ms-word");
    expect(WEBVIEW_GUEST_CSP).not.toContain("file:");
  });

  it("does not allow data document sources", () => {
    expect(WEBVIEW_GUEST_CSP).not.toContain("data:");
  });
});
