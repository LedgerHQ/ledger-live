import { defaultHandler } from "../default.handler";
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
