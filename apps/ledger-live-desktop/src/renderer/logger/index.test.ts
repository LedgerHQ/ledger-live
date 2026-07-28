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

    it("should wrap non-Error values in Error and still call captureException", () => {
      logger.critical("string error");
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(new Error("string error"));
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
