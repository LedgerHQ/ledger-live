import { buildBeforeSend, getDatadogBuildConfig, rewriteAsarUrls } from "./config";

jest.mock("~/sentry/anonymizer", () => ({
  __esModule: true,
  default: {
    filepathRecursiveReplacer: jest.fn((obj: Record<string, unknown>) => {
      obj._anonymized = true;
    }),
  },
}));

jest.mock("./ignoreErrors", () => ({
  shouldIgnoreErrorMessage: jest.fn((msg: string) => msg.includes("IGNORE_ME")),
}));

describe("datadog config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDatadogBuildConfig", () => {
    it("should return config from build globals (null in Jest) and default values", () => {
      const result = getDatadogBuildConfig();
      expect(result).toEqual({
        applicationId: null,
        clientToken: null,
        env: "production",
        service: "ledger-live-desktop",
        site: "datadoghq.eu",
      });
    });
  });

  describe("buildBeforeSend", () => {
    it("should return false when shouldSend returns false", () => {
      const shouldSend = jest.fn().mockReturnValue(false);
      const beforeSend = buildBeforeSend(shouldSend);
      expect(beforeSend({}, undefined)).toBe(false);
      expect(shouldSend).toHaveBeenCalledTimes(1);
    });

    it("should return true for non-object event", () => {
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      expect(beforeSend(null, undefined)).toBe(true);
      expect(beforeSend("string", undefined)).toBe(true);
    });

    it("should return false when error message matches ignore list", () => {
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      const event = { error: { message: "IGNORE_ME please" } };
      expect(beforeSend(event, undefined)).toBe(false);
    });

    it("should return false when event.message matches ignore list", () => {
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      expect(beforeSend({ message: "IGNORE_ME" }, undefined)).toBe(false);
    });

    it("should remove server_name from event", () => {
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      const event = { server_name: "my-machine", message: "ok" };
      expect(beforeSend(event, undefined)).toBe(true);
      expect(event).not.toHaveProperty("server_name");
    });

    it("should return true for an event with no message", () => {
      const beforeSend = buildBeforeSend(() => true);
      expect(beforeSend({ foo: "bar" }, undefined)).toBe(true);
    });

    it("should return true when asar url rewrite throws (logs and continues)", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const beforeSend = buildBeforeSend(() => true);
      const event: Record<string, unknown> = {};
      Object.defineProperty(event, "boom", {
        enumerable: true,
        get() {
          throw new Error("getter boom");
        },
      });
      expect(beforeSend(event, undefined)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Datadog beforeSend: asar url rewrite failed",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("should call anonymizer and return true for sendable event", () => {
      const anonymizer = jest.requireMock("~/sentry/anonymizer").default;
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      const event: Record<string, unknown> = { message: "Some error" };
      expect(beforeSend(event, undefined)).toBe(true);
      expect(anonymizer.filepathRecursiveReplacer).toHaveBeenCalledWith(event);
      expect(event._anonymized).toBe(true);
    });

    it("should return true when anonymizer throws (logs and continues)", () => {
      const anonymizer = jest.requireMock("~/sentry/anonymizer").default;
      jest.mocked(anonymizer.filepathRecursiveReplacer).mockImplementationOnce(() => {
        throw new Error("anonymizer failed");
      });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      const event = { message: "ok" };
      expect(beforeSend(event, undefined)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Datadog beforeSend: anonymization failed",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("should rewrite asar file:// urls in the error stack", () => {
      const shouldSend = jest.fn().mockReturnValue(true);
      const beforeSend = buildBeforeSend(shouldSend);
      const event: Record<string, unknown> = {
        error: {
          message: "CrashTestRendering",
          stack: [
            "Error: CrashTestRendering",
            "    at E0 (file:///Applications/Ledger%20Wallet%20Beta.app/Contents/Resources/app.asar/.webpack/renderer.bundle.js:8166:265)",
            "    at iV (file:///Applications/Ledger%20Wallet%20Beta.app/Contents/Resources/app.asar/.webpack/renderer.bundle.js:1447:337795)",
          ].join("\n"),
        },
      };
      expect(beforeSend(event, undefined)).toBe(true);
      const stack = (event.error as Record<string, string>).stack;
      expect(stack).toContain("https://app.asar/.webpack/renderer.bundle.js:8166:265");
      expect(stack).toContain("https://app.asar/.webpack/renderer.bundle.js:1447:337795");
      expect(stack).not.toContain("file://");
    });
  });

  describe("rewriteAsarUrls", () => {
    it("rewrites a parenthesized file:// asar frame into https://app.asar/", () => {
      const input =
        "at E0 (file:///Applications/Ledger%20Wallet%20Beta.app/Contents/Resources/app.asar/.webpack/renderer.bundle.js:8166:265)";
      expect(rewriteAsarUrls(input)).toBe(
        "at E0 (https://app.asar/.webpack/renderer.bundle.js:8166:265)",
      );
    });

    it("rewrites the Datadog-normalized '@' frame shape", () => {
      const input =
        "at E0 @ file:///Applications/Ledger%20Wallet%20Beta.app/Contents/Resources/app.asar/.webpack/renderer.bundle.js:8166:265";
      expect(rewriteAsarUrls(input)).toBe(
        "at E0 @ https://app.asar/.webpack/renderer.bundle.js:8166:265",
      );
    });

    it("rewrites windows-style file:// asar urls", () => {
      const input =
        "at fn (file:///C:/Users/me/AppData/Local/Programs/ledger-live-desktop/resources/app.asar/.webpack/main.bundle.js:42:7)";
      expect(rewriteAsarUrls(input)).toBe("at fn (https://app.asar/.webpack/main.bundle.js:42:7)");
    });

    it("leaves non-asar urls untouched", () => {
      const input = "at fn (webpack-internal:///./src/renderer/Default.tsx:253:11)";
      expect(rewriteAsarUrls(input)).toBe(input);
    });

    it("does not match the .app bundle suffix", () => {
      const input = "file:///Applications/Ledger%20Wallet%20Beta.app/Contents/Info.plist";
      expect(rewriteAsarUrls(input)).toBe(input);
    });

    it("rewrites a raw main-process bundle path with literal spaces (parenthesized frame)", () => {
      const input =
        "    at IpcMainImpl.<anonymous> (/Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/.webpack/main.bundle.js:81:104232)";
      expect(rewriteAsarUrls(input)).toBe(
        "    at IpcMainImpl.<anonymous> (https://app.asar/.webpack/main.bundle.js:81:104232)",
      );
    });

    it("rewrites a raw bare (anonymous) main-process bundle frame", () => {
      const input =
        "    at /Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/.webpack/main.bundle.js:1:2";
      expect(rewriteAsarUrls(input)).toBe("    at https://app.asar/.webpack/main.bundle.js:1:2");
    });

    it("rewrites third-party asar frames (node_modules) too, dropping the local prefix", () => {
      const input =
        "    at /Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/node_modules/dd-trace/packages/datadog-instrumentations/src/electron.js:73:47";
      expect(rewriteAsarUrls(input)).toBe(
        "    at https://app.asar/node_modules/dd-trace/packages/datadog-instrumentations/src/electron.js:73:47",
      );
    });

    it("leaves node: internal frames untouched", () => {
      const input = "    at node:diagnostics_channel:374:23";
      expect(rewriteAsarUrls(input)).toBe(input);
    });

    it("does not clobber the function name of a named frame", () => {
      const input =
        "    at IpcMainImpl.emit (/Applications/Ledger Wallet.app/Contents/Resources/app.asar/.webpack/main.bundle.js:1:2)";
      expect(rewriteAsarUrls(input)).toContain("at IpcMainImpl.emit (https://app.asar/");
    });
  });
});
