import { buyHandler } from "../buy.handler";
import { createMockContext } from "./test-utils";

describe("buy.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buyHandler", () => {
    it("navigates to exchange page", () => {
      const context = createMockContext();

      buyHandler({ type: "buy", search: "" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/exchange", undefined, "");
    });

    it("passes search params through to exchange page", () => {
      const context = createMockContext();

      buyHandler({ type: "buy", search: "?currency=btc&amount=100" }, context);

      expect(context.navigate).toHaveBeenCalledWith(
        "/exchange",
        undefined,
        "?currency=btc&amount=100",
      );
    });
  });
});
