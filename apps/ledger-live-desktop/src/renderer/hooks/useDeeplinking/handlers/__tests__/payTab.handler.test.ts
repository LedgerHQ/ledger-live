import { payTabHandler } from "../payTab.handler";
import { createMockContext } from "./test-utils";

describe("payTab.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("payTabHandler", () => {
    it("navigates to /paytab when the lwdPayTab flag is enabled", () => {
      const context = createMockContext({ isPayTabEnabled: true });

      payTabHandler({ type: "paytab" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/paytab");
    });

    it("falls back to the default handler when the lwdPayTab flag is disabled", () => {
      const context = createMockContext({ isPayTabEnabled: false });

      payTabHandler({ type: "paytab" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/");
      expect(context.navigate).not.toHaveBeenCalledWith("/paytab");
    });
  });
});
