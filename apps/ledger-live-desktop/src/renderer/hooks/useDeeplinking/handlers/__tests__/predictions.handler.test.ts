import { predictionsHandler } from "../predictions.handler";
import { createMockContext } from "./test-utils";

describe("predictions.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("predictionsHandler", () => {
    it("opens the predictions live app with the link's query params", () => {
      const context = createMockContext();
      const query = { eventSlug: "will-btc-hit-100k" };

      predictionsHandler({ type: "predictions", query }, context);

      expect(context.navigate).toHaveBeenCalledWith("/platform/predictions-live-app", query);
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
