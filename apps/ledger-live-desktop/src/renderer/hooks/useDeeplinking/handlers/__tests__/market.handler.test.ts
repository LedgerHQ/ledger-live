import { marketHandler, assetHandler } from "../market.handler";
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

describe("market.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("marketHandler", () => {
    it("navigates to market list when no path", () => {
      const context = createMockContext();

      marketHandler({ type: "market", path: "" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/market");
    });

    it("navigates to market detail when path is provided", () => {
      const context = createMockContext();

      marketHandler({ type: "market", path: "bitcoin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/market/bitcoin");
    });

    it("normalizes and navigates to market detail for a valid currency id", () => {
      const context = createMockContext();

      marketHandler({ type: "market", path: "BiTcOiN" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/market/bitcoin");
    });

    it("navigates to market list for an unknown currency id", () => {
      const context = createMockContext();

      marketHandler({ type: "market", path: "unknown_coin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/market");
    });
  });

  describe("assetHandler", () => {
    it("navigates to home when no path is provided", () => {
      const context = createMockContext();

      assetHandler({ type: "asset", path: "" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/");
    });

    it("navigates to asset page when valid currency id is provided", () => {
      const context = createMockContext();

      assetHandler({ type: "asset", path: "bitcoin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
    });

    it("normalizes and navigates to asset page for a valid currency id", () => {
      const context = createMockContext();

      assetHandler({ type: "asset", path: "BiTcOiN" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
    });

    it("navigates to home for an unknown currency id", () => {
      const context = createMockContext();

      assetHandler({ type: "asset", path: "unknown_coin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/");
    });
  });
});
