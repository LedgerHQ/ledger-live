import { postOnboardingHandler } from "../postOnboarding.handler";
import { DeeplinkHandlerContext } from "../../types";

const createMockContext = (
  overrides: Partial<DeeplinkHandlerContext> = {},
): DeeplinkHandlerContext => ({
  dispatch: jest.fn(),
  accounts: [],
  navigate: jest.fn(),
  openAddAccountFlow: jest.fn(),
  openAssetFlow: jest.fn(),
  openSendFlow: jest.fn(),
  postOnboardingDeeplinkHandler: jest.fn(),
  tryRedirectToPostOnboardingOrRecover: jest.fn(() => false),
  currentPathname: "/",
  ...overrides,
});

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
