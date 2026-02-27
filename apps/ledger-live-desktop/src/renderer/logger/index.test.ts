import winston from "winston";
import logger from "./index";

jest.mock("~/sentry/renderer", () => ({
  captureException: jest.fn(),
  captureBreadcrumb: jest.fn(),
}));

jest.mock("~/datadog/renderer", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const sentryRenderer = jest.requireMock("~/sentry/renderer");
const datadogRenderer = jest.requireMock("~/datadog/renderer");

describe("renderer logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("add", () => {
    it("should add transport without throwing", () => {
      const transport = new winston.transports.Console();
      expect(() => logger.add(transport)).not.toThrow();
    });
  });

  describe("critical", () => {
    it("should call Sentry and Datadog captureException when error is Error instance", () => {
      const err = new Error("Critical error");
      logger.critical(err);
      expect(sentryRenderer.captureException).toHaveBeenCalledWith(err);
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(err);
    });

    it("should add context breadcrumbs when context is provided", () => {
      const err = new Error("Critical error");
      logger.critical(err, "upload failed");
      expect(sentryRenderer.captureBreadcrumb).toHaveBeenCalledWith({
        level: "fatal",
        category: "context",
        message: "upload failed",
      });
      expect(datadogRenderer.addBreadcrumb).toHaveBeenCalledWith({
        level: "error",
        category: "context",
        message: "upload failed",
      });
    });

    it("should not call captureException when error is not an Error instance", () => {
      logger.critical("string error");
      expect(sentryRenderer.captureException).not.toHaveBeenCalled();
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

  describe("debug / info / log / warn / error", () => {
    it("should not throw when calling debug", () => {
      expect(() => logger.debug("msg")).not.toThrow();
    });
    it("should not throw when calling info", () => {
      expect(() => logger.info("msg")).not.toThrow();
    });
    it("should not throw when calling log", () => {
      expect(() => logger.log("msg")).not.toThrow();
    });
    it("should not throw when calling warn", () => {
      expect(() => logger.warn("msg")).not.toThrow();
    });
    it("should not throw when calling error", () => {
      expect(() => logger.error("msg")).not.toThrow();
    });
  });
});
