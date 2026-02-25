import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { accountsHandler, accountHandler } from "../accounts.handler";
import { DeeplinkHandlerContext } from "../../types";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  findCryptoCurrencyByKeyword: jest.fn(),
}));

jest.mock("../../utils", () => ({
  getAccountsOrSubAccountsByCurrency: jest.fn(),
}));

import { getAccountsOrSubAccountsByCurrency } from "../../utils";

const mockFindCryptoCurrencyByKeyword = jest.mocked(findCryptoCurrencyByKeyword);
const mockGetAccountsOrSubAccountsByCurrency = jest.mocked(getAccountsOrSubAccountsByCurrency);

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

const createMockAccount = (currencyId: string, address: string = "address123"): Account => {
  const currency = getCryptoCurrencyById(currencyId);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    id: `${currencyId}-account-1`,
    type: "Account" as const,
    name: `${currency.name} 1`,
    currency,
    freshAddress: address,
  } as unknown as Account;
};

describe("accounts.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("accountsHandler", () => {
    it("navigates to accounts list when no address provided", () => {
      const context = createMockContext();

      accountsHandler({ type: "accounts" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/accounts");
    });

    it("navigates to specific account when valid address is found", () => {
      const mockAccount = createMockAccount("bitcoin", "bc1qtest123");
      const context = createMockContext({ accounts: [mockAccount] });

      accountsHandler({ type: "accounts", address: "bc1qtest123" }, context);

      expect(context.navigate).toHaveBeenCalledWith(`/account/${mockAccount.id}`);
    });

    it("navigates to accounts list when address not found", () => {
      const mockAccount = createMockAccount("bitcoin", "bc1qtest123");
      const context = createMockContext({ accounts: [mockAccount] });

      accountsHandler({ type: "accounts", address: "nonexistent" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/accounts");
    });
  });

  describe("accountHandler", () => {
    it("does nothing when currency is not provided", () => {
      const context = createMockContext();

      accountHandler({ type: "account" }, context);

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("does nothing when currency is not found", () => {
      mockFindCryptoCurrencyByKeyword.mockReturnValue(null);
      const context = createMockContext();

      accountHandler({ type: "account", currency: "unknown" }, context);

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("does nothing when currency is a FiatCurrency", () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
      mockFindCryptoCurrencyByKeyword.mockReturnValue({ type: "FiatCurrency" } as any);
      const context = createMockContext();

      accountHandler({ type: "account", currency: "usd" }, context);

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("does nothing when no matching accounts exist", () => {
      const mockCurrency = getCryptoCurrencyById("bitcoin");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([]);
      const context = createMockContext();

      accountHandler({ type: "account", currency: "bitcoin" }, context);

      expect(context.navigate).not.toHaveBeenCalled();
    });

    it("navigates to specific account when address matches", () => {
      const mockCurrency = getCryptoCurrencyById("bitcoin");
      const mockAccount = createMockAccount("bitcoin", "bc1qtest123");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);
      const context = createMockContext({ accounts: [mockAccount] });

      accountHandler({ type: "account", currency: "bitcoin", address: "bc1qtest123" }, context);

      expect(context.navigate).toHaveBeenCalledWith(`/account/${mockAccount.id}`);
    });

    it("navigates to first matching account when no address provided", () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      const mockAccount = createMockAccount("ethereum");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);
      const context = createMockContext({ accounts: [mockAccount] });

      accountHandler({ type: "account", currency: "ethereum" }, context);

      expect(context.navigate).toHaveBeenCalledWith(`/account/${mockAccount.id}`);
    });

    it("navigates to token account with parent path", () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount" as const,
        parentId: "parent-account-1",
      } as unknown as TokenAccount;
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([tokenAccount]);
      const context = createMockContext();

      accountHandler({ type: "account", currency: "ethereum" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/account/parent-account-1/token-account-1");
    });
  });
});
