import { postOnboardingHandler } from "../postOnboarding.handler";
import { createMockContext } from "./test-utils";

describe("postOnboarding.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("postOnboardingHandler", () => {
    it("calls postOnboardingDeeplinkHandler with device", () => {
      const context = createMockContext();

      postOnboardingHandler(
        {
          type: "post-onboarding",
          device: "stax",
        },
        context,
      );

      expect(context.postOnboardingDeeplinkHandler).toHaveBeenCalledWith("stax");
    });

    it("calls postOnboardingDeeplinkHandler without device", () => {
      const context = createMockContext();

      postOnboardingHandler({ type: "post-onboarding" }, context);

      expect(context.postOnboardingDeeplinkHandler).toHaveBeenCalledWith(undefined);
    });

    it("handles various device types", () => {
      const context = createMockContext();

      postOnboardingHandler(
        {
          type: "post-onboarding",
          device: "nanoX",
        },
        context,
      );

      expect(context.postOnboardingDeeplinkHandler).toHaveBeenCalledWith("nanoX");
    });
  });
});
