import { settingsHandler } from "../settings.handler";
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

describe("settings.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("settingsHandler", () => {
    it("navigates to main settings when no path", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings");
    });

    it("maps general to display", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "general" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/display");
    });

    it("navigates to accounts settings", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "accounts" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/accounts");
    });

    it("navigates to about settings", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "about" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/about");
    });

    it("navigates to help settings", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "help" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/help");
    });

    it("navigates to experimental settings", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "experimental" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/experimental");
    });

    it("navigates to main settings for unknown path", () => {
      const context = createMockContext();

      settingsHandler({ type: "settings", path: "unknown" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings");
    });
  });
});
