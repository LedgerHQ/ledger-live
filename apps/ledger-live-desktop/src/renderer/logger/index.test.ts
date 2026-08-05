import logger, { redactQueryArg } from "./index";

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

  describe("redactQueryArg", () => {
    /**
     * `queryArg` lands in the user-exportable support log, and RTK Query keeps the
     * unstripped args on the action even when an endpoint omits them from its cache
     * key — so swap `/quote` carries live-app headers and the user's addresses.
     */
    it("redacts live-app headers and swap addresses, at any depth", () => {
      expect(
        redactQueryArg({
          endpointName: "fetchQuotes",
          customHeaders: { "x-partner-token": "super-secret" },
          quotesInput: { sendAddress: "0xfrom", receiveAddress: "0xto", amount: "1" },
        }),
      ).toEqual({
        endpointName: "fetchQuotes",
        customHeaders: "[redacted]",
        quotesInput: { sendAddress: "[redacted]", receiveAddress: "[redacted]", amount: "1" },
      });
    });

    it("keeps the surrounding shape so the log stays useful", () => {
      expect(redactQueryArg({ providers: ["lifi", "okx"], counterValueCurrency: "USD" })).toEqual({
        providers: ["lifi", "okx"],
        counterValueCurrency: "USD",
      });
    });

    it("passes through primitives and nullish values untouched", () => {
      expect(redactQueryArg("plain")).toBe("plain");
      expect(redactQueryArg(null)).toBeNull();
      expect(redactQueryArg(undefined)).toBeUndefined();
    });

    it("redacts inside arrays", () => {
      expect(redactQueryArg([{ addressFrom: "0xabc" }])).toEqual([{ addressFrom: "[redacted]" }]);
    });
  });
});
