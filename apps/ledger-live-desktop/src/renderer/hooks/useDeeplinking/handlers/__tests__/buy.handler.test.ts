import { buyHandler } from "../buy.handler";
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
      
      expect(context.navigate).toHaveBeenCalledWith("/exchange", undefined, "?currency=btc&amount=100");
    });
  });
});
