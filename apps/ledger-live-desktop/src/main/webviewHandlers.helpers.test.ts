import { describe, expect, it } from "@jest/globals";
import {
  WEBVIEW_GUEST_CSP,
  applyWebviewAttachPolicy,
  createLiveAppSchemeChecker,
  createMainFrameOriginChecker,
  mergeCspHeaders,
  takeAllowedOrigins,
  takeDomainCheckReport,
} from "./webviewHandlers.helpers";
import {
  UNRESTRICTED_ORIGINS,
  serializeAllowedOrigins,
  serializeDomainCheckReport,
} from "~/bridge/webviewAllowedOrigins";

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
  it("contains frame-src, child-src, worker-src and form-action directives", () => {
    expect(WEBVIEW_GUEST_CSP).toContain("frame-src");
    expect(WEBVIEW_GUEST_CSP).toContain("child-src");
    expect(WEBVIEW_GUEST_CSP).toContain("worker-src");
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

  it("does not allow data document sources in frame-src, child-src or form-action", () => {
    const directives = Object.fromEntries(
      WEBVIEW_GUEST_CSP.split(";")
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => [d.split(" ")[0], d]),
    );
    expect(directives["frame-src"]).not.toContain("data:");
    expect(directives["child-src"]).not.toContain("data:");
    expect(directives["form-action"]).not.toContain("data:");
  });
});

describe("applyWebviewAttachPolicy", () => {
  const options = {
    appDir: "/app",
    isSrcAllowed: createLiveAppSchemeChecker(["ledgerlive"]),
  };

  it("pins isolation, sandbox, web security and no Node", () => {
    const webPreferences: Electron.WebPreferences = {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false,
    };

    applyWebviewAttachPolicy(webPreferences, "https://example.com", options);

    expect(webPreferences).toEqual({
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    });
  });

  it.each(["webviewPreloader.bundle.js", "webviewDappPreloader.bundle.js"])(
    "resolves the %s preload from the app dir",
    preload => {
      const webPreferences: Electron.WebPreferences = { preload: `/elsewhere/${preload}` };

      applyWebviewAttachPolicy(webPreferences, "https://example.com", options);

      expect(webPreferences.preload).toBe(`/app/${preload}`);
    },
  );

  it("drops any other preload", () => {
    const webPreferences: Electron.WebPreferences = { preload: "/app/preloader.bundle.js" };

    applyWebviewAttachPolicy(webPreferences, "https://example.com", options);

    expect(webPreferences).not.toHaveProperty("preload");
  });

  it.each(["https://example.com", "http://localhost:3000", "about:blank"])("allows %s", src => {
    expect(applyWebviewAttachPolicy({}, src, options)).toBe(true);
  });

  it.each(["file:///etc/hosts", "javascript:alert(1)", "data:text/html,hi", ""])(
    "rejects %j",
    src => {
      expect(applyWebviewAttachPolicy({}, src, options)).toBe(false);
    },
  );
});

const preferencesFrom = (attribute: string) =>
  Object.fromEntries(
    attribute.split(",").map(entry => entry.split("=") as [string, string]),
  ) as Electron.WebPreferences;

describe("takeAllowedOrigins", () => {
  it("reads the origins serialized by the renderer and removes them from the preferences", () => {
    const webPreferences = preferencesFrom(
      `nativeWindowOpen=no,${serializeAllowedOrigins(["https://a.com", "https://*.b.com"])}`,
    );

    expect(takeAllowedOrigins(webPreferences)).toEqual(["https://a.com", "https://*.b.com"]);
    expect(webPreferences).toEqual({ nativeWindowOpen: "no" });
  });

  it("reads an empty origin list", () => {
    expect(takeAllowedOrigins(preferencesFrom(serializeAllowedOrigins([])))).toEqual([]);
  });

  it("reads the unrestricted marker", () => {
    expect(takeAllowedOrigins(preferencesFrom(serializeAllowedOrigins(UNRESTRICTED_ORIGINS)))).toBe(
      UNRESTRICTED_ORIGINS,
    );
  });

  it.each([
    ["missing", {}],
    ["coerced to a boolean by Electron", { ledgerLiveAllowedOrigins: true }],
    ["not JSON", { ledgerLiveAllowedOrigins: "https://a.com" }],
    ["not a string array", { ledgerLiveAllowedOrigins: encodeURIComponent("[1]") }],
    ["not an array", { ledgerLiveAllowedOrigins: encodeURIComponent('"https://a.com"') }],
  ])("returns undefined when the value is %s", (_, webPreferences) => {
    expect(takeAllowedOrigins(webPreferences as Electron.WebPreferences)).toBeUndefined();
  });
});

describe("createMainFrameOriginChecker", () => {
  const isAllowed = createMainFrameOriginChecker(["ledgerlive", "ledgerwallet"]);
  const origins = ["https://app.example.com", "https://*.cdn.example.com"];

  it.each([
    ["https://app.example.com/path?q=1"],
    ["https://img.cdn.example.com/"],
    ["about:blank"],
    ["ledgerlive://discover"],
    ["ledgerwallet://deeplink"],
  ])("allows %s for a guest with manifest origins", url => {
    expect(isAllowed(url, origins)).toBe(true);
  });

  it.each([
    ["https://evil.com"],
    ["https://app.example.com.evil.com"],
    ["http://app.example.com"],
    ["https://example.com"],
    ["data:text/html,hi"],
    ["javascript:alert(1)"],
    ["file:///etc/hosts"],
    ["about:srcdoc"],
    ["not a url"],
  ])("blocks %s for a guest with manifest origins", url => {
    expect(isAllowed(url, origins)).toBe(false);
  });

  it("blocks everything but about:blank for a guest without origins", () => {
    expect(isAllowed("https://app.example.com", undefined)).toBe(false);
    expect(isAllowed("ledgerlive://discover", undefined)).toBe(false);
    expect(isAllowed("about:blank", undefined)).toBe(true);
  });

  it("blocks everything but about:blank and deep links for an empty origin list", () => {
    expect(isAllowed("https://app.example.com", [])).toBe(false);
    expect(isAllowed("ledgerlive://discover", [])).toBe(true);
    expect(isAllowed("about:blank", [])).toBe(true);
  });

  it("allows any web origin when unrestricted", () => {
    expect(isAllowed("https://evil.com", UNRESTRICTED_ORIGINS)).toBe(true);
    expect(isAllowed("not a url", UNRESTRICTED_ORIGINS)).toBe(false);
  });
});

describe("takeDomainCheckReport", () => {
  it("reads the report context, keeps the strict domains and removes it from the preferences", () => {
    const webPreferences = preferencesFrom(
      [
        "nativeWindowOpen=no",
        serializeAllowedOrigins(UNRESTRICTED_ORIGINS),
        serializeDomainCheckReport({
          manifestId: "swap",
          domains: ["https://*", "https://app.example.com", "https://*.b.com"],
        }),
      ].join(","),
    );

    expect(takeDomainCheckReport(webPreferences)).toEqual({
      manifestId: "swap",
      domains: ["https://app.example.com", "https://*.b.com"],
    });
    expect(takeAllowedOrigins(webPreferences)).toBe(UNRESTRICTED_ORIGINS);
    expect(webPreferences).toEqual({ nativeWindowOpen: "no" });
  });

  it.each([
    ["missing", {}],
    ["coerced to a boolean by Electron", { ledgerLiveDomainCheckReport: true }],
    ["not JSON", { ledgerLiveDomainCheckReport: "swap" }],
    [
      "without a manifest id",
      { ledgerLiveDomainCheckReport: encodeURIComponent('{"domains":[]}') },
    ],
    [
      "with non-string domains",
      { ledgerLiveDomainCheckReport: encodeURIComponent('{"manifestId":"a","domains":[1]}') },
    ],
  ])("returns undefined when the value is %s", (_, webPreferences) => {
    expect(takeDomainCheckReport(webPreferences as Electron.WebPreferences)).toBeUndefined();
  });
});
