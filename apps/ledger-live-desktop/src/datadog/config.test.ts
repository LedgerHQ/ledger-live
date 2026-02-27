import { buildBeforeSend, getDatadogBuildConfig } from "./config";

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
    it("should return config from build globals (null in Jest)", () => {
      const result = getDatadogBuildConfig();
      expect(result).toEqual({
        applicationId: null,
        clientToken: null,
        site: null,
        env: null,
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
  });
});
