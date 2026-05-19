import { swapHandler } from "../swap.handler";
import { createMockContext } from "./test-utils";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";

jest.mock("@ledgerhq/live-common/wallet-api/converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn(),
}));

const mockedGetAccountIdFromWalletAccountId =
  getAccountIdFromWalletAccountId as jest.MockedFunction<typeof getAccountIdFromWalletAccountId>;

describe("swap.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountIdFromWalletAccountId.mockReset();
  });

  describe("swapHandler", () => {
    it("navigates to swap page with default tokens when fromToken and toToken are different", () => {
      const context = createMockContext();

      swapHandler({ type: "swap", fromToken: "bitcoin", toToken: "ethereum" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
      });
    });

    it("sets default tokens when fromToken and toToken are the same", () => {
      const context = createMockContext();

      swapHandler({ type: "swap", fromToken: "bitcoin", toToken: "bitcoin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "bitcoin" },
      });
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

    it("sets from when fromPath is provided", () => {
      const context = createMockContext();

      swapHandler(
        {
          type: "swap",
          fromToken: "bitcoin",
          toToken: "ethereum",
          fromPath: "/market",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
        from: "/market",
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
          fromPath: "/market",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/swap", {
        defaultToken: { fromTokenId: "bitcoin", toTokenId: "ethereum" },
        defaultAmountFrom: "1.5",
        affiliate: "partner",
        from: "/market",
      });
    });

    describe("fromAccountId / toAccountId", () => {
      const WAPI_FROM = "11111111-1111-1111-1111-111111111111";
      const WAPI_TO = "22222222-2222-2222-2222-222222222222";
      const INTERNAL_FROM = "js:2:bitcoin:xpub-from:segwit";
      const INTERNAL_TO = "js:2:ethereum:0xabc:";

      it("forwards the resolved internal id for toAccountId when the lookup succeeds", () => {
        const context = createMockContext();
        mockedGetAccountIdFromWalletAccountId.mockImplementation(id =>
          id === WAPI_TO ? INTERNAL_TO : undefined,
        );

        swapHandler(
          { type: "swap", fromToken: "usdc", toToken: "usdt", toAccountId: WAPI_TO },
          context,
        );

        expect(context.navigate).toHaveBeenCalledWith("/swap", {
          defaultToken: { fromTokenId: "usdc", toTokenId: "usdt" },
          defaultAccountId: { toAccountId: INTERNAL_TO },
        });
      });

      it("forwards the resolved internal id for fromAccountId when the lookup succeeds", () => {
        const context = createMockContext();
        mockedGetAccountIdFromWalletAccountId.mockImplementation(id =>
          id === WAPI_FROM ? INTERNAL_FROM : undefined,
        );

        swapHandler(
          { type: "swap", fromToken: "usdc", toToken: "usdt", fromAccountId: WAPI_FROM },
          context,
        );

        expect(context.navigate).toHaveBeenCalledWith("/swap", {
          defaultToken: { fromTokenId: "usdc", toTokenId: "usdt" },
          defaultAccountId: { fromAccountId: INTERNAL_FROM },
        });
      });

      it("forwards both fromAccountId and toAccountId converted to internal ids", () => {
        const context = createMockContext();
        mockedGetAccountIdFromWalletAccountId.mockImplementation(id => {
          if (id === WAPI_FROM) return INTERNAL_FROM;
          if (id === WAPI_TO) return INTERNAL_TO;
          return undefined;
        });

        swapHandler(
          {
            type: "swap",
            fromToken: "usdc",
            toToken: "usdt",
            fromAccountId: WAPI_FROM,
            toAccountId: WAPI_TO,
          },
          context,
        );

        expect(mockedGetAccountIdFromWalletAccountId).toHaveBeenCalledWith(WAPI_FROM);
        expect(mockedGetAccountIdFromWalletAccountId).toHaveBeenCalledWith(WAPI_TO);
        expect(context.navigate).toHaveBeenCalledWith("/swap", {
          defaultToken: { fromTokenId: "usdc", toTokenId: "usdt" },
          defaultAccountId: {
            fromAccountId: INTERNAL_FROM,
            toAccountId: INTERNAL_TO,
          },
        });
      });

      it("falls back to the raw id when the wallet-api map is cold (cold-start deeplink)", () => {
        const context = createMockContext();
        mockedGetAccountIdFromWalletAccountId.mockReturnValue(undefined);

        swapHandler(
          {
            type: "swap",
            fromToken: "usdc",
            toToken: "usdt",
            fromAccountId: WAPI_FROM,
            toAccountId: WAPI_TO,
          },
          context,
        );

        expect(context.navigate).toHaveBeenCalledWith("/swap", {
          defaultToken: { fromTokenId: "usdc", toTokenId: "usdt" },
          defaultAccountId: {
            fromAccountId: WAPI_FROM,
            toAccountId: WAPI_TO,
          },
        });
      });
    });
  });
});
