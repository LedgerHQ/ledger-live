import { recoverHandler, recoverRestoreFlowHandler } from "../recover.handler";
import { DeeplinkHandlerContext } from "../../types";

const createMockContext = (overrides: Partial<DeeplinkHandlerContext> = {}): DeeplinkHandlerContext => ({
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

describe("recover.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("recoverHandler", () => {
    it("navigates to recover page with path", () => {
      const context = createMockContext();
      
      recoverHandler({
        type: "recover",
        path: "protect-setup",
        search: "",
      }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/recover/protect-setup", undefined, "");
    });

    it("passes search params through", () => {
      const context = createMockContext();
      
      recoverHandler({
        type: "recover",
        path: "platform",
        search: "?step=2",
      }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/recover/platform", undefined, "?step=2");
    });

    it("handles empty path", () => {
      const context = createMockContext();
      
      recoverHandler({
        type: "recover",
        path: "",
        search: "",
      }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/recover/", undefined, "");
    });
  });

  describe("recoverRestoreFlowHandler", () => {
    it("navigates to recover-restore page", () => {
      const context = createMockContext();
      
      recoverRestoreFlowHandler({ type: "recover-restore-flow" }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/recover-restore");
    });
  });
});
