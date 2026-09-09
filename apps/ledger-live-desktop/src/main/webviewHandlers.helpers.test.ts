import { describe, expect, it } from "@jest/globals";
import {
  WEBVIEW_GUEST_CSP,
  createLiveAppSchemeChecker,
  isDeviceCaptureRequest,
  isParsablePermissionsPolicy,
  mergeCspHeaders,
  mergePermissionsPolicyHeaders,
  resolvePermissionCheck,
  resolvePermissionRequest,
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

describe("mergePermissionsPolicyHeaders", () => {
  const INJECTED = "display-capture=()";

  it("sets our policy when no Permissions-Policy header exists", () => {
    const merged = mergePermissionsPolicyHeaders({ "Content-Type": ["text/html"] }, INJECTED);

    expect(merged["Permissions-Policy"]).toEqual([INJECTED]);
    expect(merged["Content-Type"]).toEqual(["text/html"]);
  });

  it("handles an undefined responseHeaders argument", () => {
    expect(mergePermissionsPolicyHeaders(undefined, INJECTED)["Permissions-Policy"]).toEqual([
      INJECTED,
    ]);
  });

  it("keeps a Live App's own cross-origin delegation instead of replacing it", () => {
    // A fiat ramp delegating camera into its cross-origin KYC iframe: dropping
    // this header would fall back to the `self` default and break getUserMedia.
    const original = 'camera=(self "https://kyc.example")';
    const merged = mergePermissionsPolicyHeaders({ "Permissions-Policy": [original] }, INJECTED);

    expect(merged["Permissions-Policy"]).toEqual([INJECTED, original]);
  });

  it("orders our policy first so it wins a conflict on the same feature", () => {
    const original = "display-capture=*";
    const merged = mergePermissionsPolicyHeaders({ "Permissions-Policy": [original] }, INJECTED);

    // Chromium keeps the first declaration of a duplicated feature.
    expect(merged["Permissions-Policy"]?.[0]).toBe(INJECTED);
  });

  it("normalises a lowercase permissions-policy header to the canonical key", () => {
    // How the header always arrives over HTTP/2; a plain assignment would emit two.
    const original = "geolocation=()";
    const merged = mergePermissionsPolicyHeaders({ "permissions-policy": [original] }, INJECTED);

    expect(merged["Permissions-Policy"]).toEqual([INJECTED, original]);
    expect(merged["permissions-policy"]).toBeUndefined();
  });

  it("normalises mixed-case PeRmIsSiOnS-PoLiCy to the canonical key", () => {
    const original = "geolocation=()";
    const merged = mergePermissionsPolicyHeaders({ "PeRmIsSiOnS-PoLiCy": [original] }, INJECTED);

    expect(merged["Permissions-Policy"]).toEqual([INJECTED, original]);
    expect(merged["PeRmIsSiOnS-PoLiCy"]).toBeUndefined();
  });

  it("does not mutate the input headers", () => {
    const input = { "Permissions-Policy": ["geolocation=()"] };
    const snapshot = JSON.parse(JSON.stringify(input));

    mergePermissionsPolicyHeaders(input, INJECTED);

    expect(input).toEqual(snapshot);
  });

  it("drops an unparsable policy instead of letting it take ours down", () => {
    // Chromium comma-joins every instance and discards the whole dictionary on a
    // parse error, so merging a malformed value would neutralise our own member.
    const merged = mergePermissionsPolicyHeaders({ "Permissions-Policy": ["camera=(("] }, INJECTED);

    expect(merged["Permissions-Policy"]).toEqual([INJECTED]);
  });

  it("drops every value when only one of them is unparsable", () => {
    const merged = mergePermissionsPolicyHeaders(
      { "Permissions-Policy": ["geolocation=()", "camera=(("] },
      INJECTED,
    );

    expect(merged["Permissions-Policy"]).toEqual([INJECTED]);
  });
});

describe("isParsablePermissionsPolicy", () => {
  it.each([
    ["display-capture=()"],
    ["geolocation=*"],
    ["fullscreen=self"],
    ['camera=(self "https://kyc.example")'],
    ['camera=(self "https://a.example" "https://b.example"), geolocation=()'],
    ["autoplay=(), camera=*"],
    ["ch-ua-platform=*"],
    // An empty dictionary is a valid structured field.
    [""],
    ["   "],
  ])("accepts %s", value => {
    expect(isParsablePermissionsPolicy(value)).toBe(true);
  });

  it.each([["camera=(("], ["camera=)"], ['camera=self"'], ["=()"], ["camera=(self"]])(
    "rejects %s",
    value => {
      expect(isParsablePermissionsPolicy(value)).toBe(false);
    },
  );
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

describe("isDeviceCaptureRequest", () => {
  it("treats an empty mediaTypes list as a non-device capture", () => {
    // What a chromeMediaSource:"desktop" getUserMedia arrives as (DONJON-1404).
    expect(isDeviceCaptureRequest([])).toBe(false);
  });

  it("treats a missing mediaTypes list as a non-device capture", () => {
    expect(isDeviceCaptureRequest(undefined)).toBe(false);
  });

  it.each([[["video"]], [["audio"]], [["video", "audio"]]] as Array<[Array<"video" | "audio">]>)(
    "recognises %j as a device capture",
    mediaTypes => {
      expect(isDeviceCaptureRequest(mediaTypes)).toBe(true);
    },
  );
});

describe("resolvePermissionRequest", () => {
  describe("Live App guests", () => {
    it("denies whole-desktop capture requested through the media permission", () => {
      expect(resolvePermissionRequest({ isGuest: true, permission: "media", mediaTypes: [] })).toBe(
        false,
      );
    });

    it("allows the camera, which live apps use for QR scanning and KYC", () => {
      expect(
        resolvePermissionRequest({ isGuest: true, permission: "media", mediaTypes: ["video"] }),
      ).toBe(true);
    });

    it("denies display-capture outright", () => {
      expect(resolvePermissionRequest({ isGuest: true, permission: "display-capture" })).toBe(
        false,
      );
    });

    it.each([["geolocation"], ["notifications"], ["midi"], ["openExternal"], ["unknown"]])(
      "denies %s",
      permission => {
        expect(resolvePermissionRequest({ isGuest: true, permission })).toBe(false);
      },
    );

    it.each([
      ["fullscreen"],
      ["clipboard-sanitized-write"],
      // Granted before the allowlist existed and still needed: a cross-site KYC
      // iframe calling requestStorageAccess, and "paste a WalletConnect URI".
      ["storage-access"],
      ["top-level-storage-access"],
      ["clipboard-read"],
    ])("allows %s", permission => {
      expect(resolvePermissionRequest({ isGuest: true, permission })).toBe(true);
    });
  });

  describe("host renderer", () => {
    it("allows the camera for the Send flow QR scanner", () => {
      expect(
        resolvePermissionRequest({ isGuest: false, permission: "media", mediaTypes: ["video"] }),
      ).toBe(true);
    });

    it("denies desktop capture even to the host, which never needs it", () => {
      expect(
        resolvePermissionRequest({ isGuest: false, permission: "media", mediaTypes: [] }),
      ).toBe(false);
    });

    it("denies geolocation", () => {
      expect(resolvePermissionRequest({ isGuest: false, permission: "geolocation" })).toBe(false);
    });
  });
});

describe("resolvePermissionCheck", () => {
  // Chromium only falls through to the request handler when the check denies, so
  // a `media` check that returned true would skip the capture discriminator.
  it.each([[true], [false]])("denies media for isGuest=%s so the request handler runs", isGuest => {
    expect(resolvePermissionCheck({ isGuest, permission: "media" })).toBe(false);
  });

  it("keeps hid available to the host renderer", () => {
    expect(resolvePermissionCheck({ isGuest: false, permission: "hid" })).toBe(true);
  });

  it("denies hid to a guest", () => {
    expect(resolvePermissionCheck({ isGuest: true, permission: "hid" })).toBe(false);
  });

  it("denies everything else for the host, as before DONJON-1404", () => {
    expect(resolvePermissionCheck({ isGuest: false, permission: "geolocation" })).toBe(false);
    expect(resolvePermissionCheck({ isGuest: false, permission: "fullscreen" })).toBe(false);
  });
});
