import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { addAccountHandler } from "../addAccount.handler";
import { DeeplinkHandlerContext } from "../../types";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  findCryptoCurrencyByKeyword: jest.fn(),
}));

const mockFindCryptoCurrencyByKeyword = jest.mocked(findCryptoCurrencyByKeyword);

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

describe("addAccount.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addAccountHandler", () => {
    it("opens add account flow with valid currency", () => {
      const mockCurrency = getCryptoCurrencyById("bitcoin");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      const context = createMockContext();
      
      addAccountHandler({ type: "add-account", currency: "bitcoin" }, context);
      
      expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("BITCOIN");
      expect(context.openAddAccountFlow).toHaveBeenCalledWith(mockCurrency, true);
    });

    it("does not open add account flow when currency not found", () => {
      mockFindCryptoCurrencyByKeyword.mockReturnValue(null);
      const context = createMockContext();
      
      addAccountHandler({ type: "add-account", currency: "unknowncoin" }, context);
      
      expect(context.openAddAccountFlow).not.toHaveBeenCalled();
    });

    it("handles case-insensitive currency parameter", () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      const context = createMockContext();
      
      addAccountHandler({ type: "add-account", currency: "ETHEREUM" }, context);
      
      expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("ETHEREUM");
      expect(context.openAddAccountFlow).toHaveBeenCalledWith(mockCurrency, true);
    });

    it("does nothing when currency is not provided", () => {
      mockFindCryptoCurrencyByKeyword.mockReturnValue(null);
      const context = createMockContext();
      
      addAccountHandler({ type: "add-account" }, context);
      
      expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("");
      expect(context.openAddAccountFlow).not.toHaveBeenCalled();
    });
  });
});
