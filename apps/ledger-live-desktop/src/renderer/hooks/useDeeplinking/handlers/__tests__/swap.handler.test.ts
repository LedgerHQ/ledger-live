import { swapHandler } from "../swap.handler";
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

describe("swap.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("swapHandler", () => {
    it("navigates to swap page with default tokens when fromToken and toToken are different", () => {
      const context = createMockContext();

      swapHandler({ type: "swap", fromToken: "bitcoin", toToken: "ethereum" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
      });
    });

    it("does not set default tokens when fromToken and toToken are the same", () => {
      const context = createMockContext();

      swapHandler({ type: "swap", fromToken: "bitcoin", toToken: "bitcoin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/swap", {});
    });

    it("sets defaultAmountFrom when provided along with default tokens", () => {
      const context = createMockContext();

      swapHandler(
        { type: "swap", fromToken: "bitcoin", toToken: "ethereum", amountFrom: "0.5" },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
        defaultAmountFrom: "0.5",
      });
    });

    it("sets affiliate when provided along with default tokens", () => {
      const context = createMockContext();

      swapHandler(
        { type: "swap", fromToken: "bitcoin", toToken: "ethereum", affiliate: "partner123" },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
        affiliate: "partner123",
      });
    });

    it("combines all parameters", () => {
      const context = createMockContext();

      swapHandler(
        {
          type: "swap",
          fromToken: "bitcoin",
          toToken: "ethereum",
          amountFrom: "1.5",
          affiliate: "partner",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
        defaultAmountFrom: "1.5",
        affiliate: "partner",
      });
    });
  });
});
