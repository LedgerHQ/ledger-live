import { predictionsHandler } from "../predictions.handler";
import { createMockContext } from "./test-utils";

describe("predictions.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("predictionsHandler", () => {
    it("opens the predictions screen with the link's query params", () => {
      const context = createMockContext();
      const query = { eventSlug: "will-btc-hit-100k" };

      predictionsHandler({ type: "predictions", query }, context);

      expect(context.navigate).toHaveBeenCalledWith("/predictions", { ...query, returnTo: "/" });
    });

    it("returns to the page the link was opened from", () => {
      const context = createMockContext({ currentPathname: "/accounts" });

      predictionsHandler(
        { type: "predictions", query: { eventSlug: "will-btc-hit-100k" } },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/predictions", {
        eventSlug: "will-btc-hit-100k",
        returnTo: "/accounts",
      });
    });

    it("keeps the return page when a link opens while predictions is already open", () => {
      const context = createMockContext({
        currentPathname: "/predictions",
        currentLocationState: { eventSlug: "previous-event", returnTo: "/accounts" },
      });

      predictionsHandler({ type: "predictions", query: { eventSlug: "next-event" } }, context);

      expect(context.navigate).toHaveBeenCalledWith("/predictions", {
        eventSlug: "next-event",
        returnTo: "/accounts",
      });
    });

    it("ignores a return page set by the link", () => {
      const context = createMockContext({ currentPathname: "/accounts" });

      predictionsHandler({ type: "predictions", query: { returnTo: "/settings" } }, context);

      expect(context.navigate).toHaveBeenCalledWith("/predictions", { returnTo: "/accounts" });
    });

    it("ignores the link when the predictions live app is not available", () => {
      const context = createMockContext({ isPredictionsAvailable: false });

      predictionsHandler(
        { type: "predictions", query: { eventSlug: "will-btc-hit-100k" } },
        context,
      );

      expect(context.navigate).not.toHaveBeenCalled();
    });
  });
});
