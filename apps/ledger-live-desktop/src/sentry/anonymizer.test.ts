/* eslint-disable @typescript-eslint/no-require-imports -- need require() after resetModules to get fresh module with env */
describe("sentry anonymizer", () => {
  const origEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  describe("filepath", () => {
    it("should return path unchanged when env paths are not set", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "";
      process.env.HOME_DIRECTORY = "";
      const anonymizer = require("~/sentry/anonymizer").default;
      expect(anonymizer.filepath("/some/path")).toBe("");
    });

    it("should return path unchanged for app:// URLs", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/config";
      process.env.HOME_DIRECTORY = "/tmp/home";
      const anonymizer = require("~/sentry/anonymizer").default;
      expect(anonymizer.filepath("app://foo/bar")).toBe("app://foo/bar");
    });

    it("should replace USER_DATA path when LEDGER_CONFIG_DIRECTORY is set", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/user-data";
      process.env.HOME_DIRECTORY = "/tmp/home";
      const anonymizer = require("~/sentry/anonymizer").default;
      expect(anonymizer.filepath("/tmp/user-data/foo/log.txt")).toBe("$USER_DATA/foo/log.txt");
    });

    it("should replace HOME path when HOME_DIRECTORY is set", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/config";
      process.env.HOME_DIRECTORY = "/Users/test";
      const anonymizer = require("~/sentry/anonymizer").default;
      expect(anonymizer.filepath("/Users/test/file")).toBe("$HOME/file");
    });

    it("should replace both paths when both are set", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/config";
      process.env.HOME_DIRECTORY = "/tmp/home";
      const anonymizer = require("~/sentry/anonymizer").default;
      expect(anonymizer.filepath("/tmp/home/.config/app")).toBe("$HOME/.config/app");
      expect(anonymizer.filepath("/tmp/config/log")).toBe("$USER_DATA/log");
    });

    it("should replace URI-encoded path (query string form, encodeURIComponent)", () => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/config";
      process.env.HOME_DIRECTORY = "/Users/test";
      const anonymizer = require("~/sentry/anonymizer").default;
      const encoded = encodeURIComponent("/Users/test/dev/app/.webpack");
      expect(encoded).toContain("%2F"); // slashes are encoded in query params
      const url = `http://localhost:8080/index.html?appDirname=${encoded}`;
      const result = anonymizer.filepath(url);
      expect(result).not.toContain("Users");
      expect(result).not.toContain("test");
      expect(result).toContain("$HOME");
      expect(result).toContain("8080/index.html?appDirname=");
    });
  });

  describe("filepathRecursiveReplacer", () => {
    beforeEach(() => {
      process.env.LEDGER_CONFIG_DIRECTORY = "/tmp/config";
      process.env.HOME_DIRECTORY = "/tmp/home";
    });

    it("should replace path in plain object", () => {
      const anonymizer = require("~/sentry/anonymizer").default;
      const obj = { path: "/tmp/config/foo" };
      anonymizer.filepathRecursiveReplacer(obj);
      expect(obj.path).toBe("$USER_DATA/foo");
    });

    it("should replace path in array", () => {
      const anonymizer = require("~/sentry/anonymizer").default;
      const arr = ["/tmp/home/x"];
      anonymizer.filepathRecursiveReplacer(arr);
      expect(arr[0]).toBe("$HOME/x");
    });

    it("should replace path in Error message", () => {
      const anonymizer = require("~/sentry/anonymizer").default;
      const err = new Error("Failed at /tmp/config/file.ts");
      anonymizer.filepathRecursiveReplacer(err);
      expect(err.message).toBe("Failed at $USER_DATA/file.ts");
    });

    it("should handle nested objects", () => {
      const anonymizer = require("~/sentry/anonymizer").default;
      const obj = { inner: { path: "/tmp/home/bar" } };
      anonymizer.filepathRecursiveReplacer(obj);
      expect(obj).toMatchObject({ inner: { path: "$HOME/bar" } });
    });

    it("should not recurse into already-seen references (circular)", () => {
      const anonymizer = require("~/sentry/anonymizer").default;
      const obj: Record<string, unknown> = { a: "/tmp/config/x" };
      obj.self = obj;
      anonymizer.filepathRecursiveReplacer(obj);
      expect(obj.a).toBe("$USER_DATA/x");
      expect(obj.self).toBe(obj);
    });
  });
});
