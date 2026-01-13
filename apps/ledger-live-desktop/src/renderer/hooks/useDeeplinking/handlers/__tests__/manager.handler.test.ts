import { managerHandler } from "../manager.handler";
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

describe("manager.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("managerHandler", () => {
    it("navigates to manager without query when no installApp", () => {
      const context = createMockContext();
      
      managerHandler({ type: "myledger" }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/manager");
    });

    it("navigates to manager with search query when installApp provided", () => {
      const context = createMockContext();
      
      managerHandler({ type: "myledger", installApp: "bitcoin" }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/manager", undefined, "?q=bitcoin");
    });

    it("handles different app names", () => {
      const context = createMockContext();
      
      managerHandler({ type: "myledger", installApp: "ethereum" }, context);
      
      expect(context.navigate).toHaveBeenCalledWith("/manager", undefined, "?q=ethereum");
    });
  });
});
