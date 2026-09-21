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

      expect(context.navigate).toHaveBeenCalledWith("/paytab", undefined);
    });

    it("carries the Card login authorization code as router state", () => {
      const context = createMockContext({ isPayTabEnabled: true });

      payTabHandler({ type: "paytab", code: "auth-code" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/paytab", { code: "auth-code" });
    });

    it("carries the attempt state alongside the authorization code", () => {
      const context = createMockContext({ isPayTabEnabled: true });

      payTabHandler({ type: "paytab", code: "auth-code", state: "attempt-state" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/paytab", {
        code: "auth-code",
        state: "attempt-state",
      });
    });

    it("falls back to the default handler when the lwdPayTab flag is disabled", () => {
      const context = createMockContext({ isPayTabEnabled: false });

      payTabHandler({ type: "paytab" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/");
      expect(context.navigate).not.toHaveBeenCalledWith("/paytab");
    });
  });
});
