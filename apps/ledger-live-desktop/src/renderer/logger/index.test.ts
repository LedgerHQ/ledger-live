import logger from "./index";

jest.mock("~/datadog/renderer", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const datadogRenderer = jest.requireMock("~/datadog/renderer");

describe("renderer logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("critical", () => {
    it("should call Datadog captureException when error is Error instance", () => {
      const err = new Error("Critical error");
      logger.critical(err);
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(err);
    });

    it("should add context breadcrumbs when context is provided", () => {
      const err = new Error("Critical error");
      logger.critical(err, "upload failed");
      expect(datadogRenderer.addBreadcrumb).toHaveBeenCalledWith({
        level: "error",
        category: "context",
        message: "upload failed",
      });
    });

    it("should wrap string values in Error and still call captureException", () => {
      logger.critical("string error");
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(new Error("string error"));
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["a plain object", { code: 42 }],
      ["a DMK tagged error", { _tag: "DeviceLockedError" }],
    ])("should keep %s local instead of reporting it to Datadog", (_label, value) => {
      logger.critical(value);
      expect(datadogRenderer.captureException).not.toHaveBeenCalled();
    });
  });

  describe("analyticsTrack", () => {
    it("should call datadog addBreadcrumb with track category", () => {
      logger.analyticsTrack("button_clicked", { button: "submit" });
      expect(datadogRenderer.addBreadcrumb).toHaveBeenCalledWith({
        level: "info",
        category: "track",
        message: "button_clicked",
        data: { button: "submit" },
      });
    });
  });
});
