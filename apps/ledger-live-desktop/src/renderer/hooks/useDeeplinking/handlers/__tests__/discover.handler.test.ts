import { CARD_APP_ID, WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { cardHandler, discoverHandler, walletConnectHandler } from "../discover.handler";
import { DeeplinkHandlerContext } from "../../types";

jest.mock("@ledgerhq/live-common/wallet-api/constants", () => ({
  CARD_APP_ID: "cl-card",
  WC_ID: "wallet-connect",
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: jest.fn(),
}));

const mockSetTrackingSource = jest.mocked(setTrackingSource);

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

describe("discover.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cardHandler", () => {
    it("navigates to card page with query params", () => {
      const context = createMockContext();
      const query = { param: "value" };

      cardHandler({ type: "card", query }, context);

      expect(context.navigate).toHaveBeenCalledWith("/card", query);
    });

    it("navigates to card page with empty query", () => {
      const context = createMockContext();

      cardHandler({ type: "card", query: {} }, context);

      expect(context.navigate).toHaveBeenCalledWith("/card", {});
    });
  });

  describe("discoverHandler", () => {
    it("navigates to recover for protect paths", () => {
      const context = createMockContext();

      discoverHandler(
        {
          type: "discover",
          path: "protect-setup",
          query: {},
          search: "?foo=bar",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith(
        "/recover/protect-setup",
        undefined,
        "?foo=bar",
      );
    });

    it("navigates to card page for CARD_APP_ID", () => {
      const context = createMockContext();
      const query = { param: "value" };

      discoverHandler(
        {
          type: "discover",
          path: CARD_APP_ID,
          query,
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/card", query);
    });

    it("navigates to platform for other paths", () => {
      const context = createMockContext();
      const query = { accountId: "123" };

      discoverHandler(
        {
          type: "discover",
          path: "paraswap",
          query,
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/platform/paraswap", query);
    });

    it("navigates to platform root when no path", () => {
      const context = createMockContext();

      discoverHandler(
        {
          type: "discover",
          path: "",
          query: {},
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/platform/", {});
    });
  });

  describe("walletConnectHandler", () => {
    it("navigates to wallet connect platform", () => {
      const context = createMockContext();
      const query = { uri: "wc:test123" };

      walletConnectHandler({ type: "wc", uri: "wc:test123", query }, context);

      expect(mockSetTrackingSource).toHaveBeenCalledWith("deeplink");
      expect(context.navigate).toHaveBeenCalledWith(`/platform/${WC_ID}`, query);
    });

    it("does nothing when already on WC page and no uri", () => {
      const context = createMockContext({ currentPathname: `/platform/${WC_ID}` });

      walletConnectHandler({ type: "wc", query: {} }, context);

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("does nothing when already on WC page and uri has requestId", () => {
      const context = createMockContext({ currentPathname: `/platform/${WC_ID}` });
      const uriWithRequestId = "wc:test?requestId=123";

      walletConnectHandler(
        {
          type: "wc",
          uri: uriWithRequestId,
          query: { uri: uriWithRequestId },
        },
        context,
      );

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("navigates when on WC page but uri has no requestId", () => {
      const context = createMockContext({ currentPathname: `/platform/${WC_ID}` });
      const uri = "wc:test123";

      walletConnectHandler({ type: "wc", uri, query: { uri } }, context);

      expect(context.navigate).toHaveBeenCalledWith(`/platform/${WC_ID}`, { uri });
    });
  });
});
