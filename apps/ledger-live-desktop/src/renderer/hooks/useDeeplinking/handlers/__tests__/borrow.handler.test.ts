import { borrowHandler } from "../borrow.handler";
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
  accountsPath: "/accounts",
  ...overrides,
});

describe("borrow.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("borrowHandler", () => {
    it("navigates to borrow when no query", () => {
      const context = createMockContext();

      borrowHandler(
        {
          type: "borrow",
          path: "",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/borrow", undefined, "");
    });

    it("passes search params to borrow", () => {
      const context = createMockContext();

      borrowHandler(
        {
          type: "borrow",
          path: "",
          search: "?action=open",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/borrow", undefined, "?action=open");
    });
  });
});
