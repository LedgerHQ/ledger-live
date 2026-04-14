import { defaultHandler } from "../default.handler";
import { createMockContext } from "./test-utils";

describe("default.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("defaultHandler", () => {
    it("navigates to home when redirect returns false", () => {
      const context = createMockContext({
        tryRedirectToPostOnboardingOrRecover: jest.fn(() => false),
      });

      defaultHandler({ type: "default" }, context);

      expect(context.tryRedirectToPostOnboardingOrRecover).toHaveBeenCalled();
      expect(context.navigate).toHaveBeenCalledWith("/");
    });

    it("does not navigate when redirect returns true", () => {
      const context = createMockContext({
        tryRedirectToPostOnboardingOrRecover: jest.fn(() => true),
      });

      defaultHandler({ type: "default" }, context);

      expect(context.tryRedirectToPostOnboardingOrRecover).toHaveBeenCalled();
      expect(context.navigate).not.toHaveBeenCalled();
    });
  });
});
