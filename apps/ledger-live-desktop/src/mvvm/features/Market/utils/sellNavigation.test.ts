import { buildSellNavigationState } from "./sellNavigation";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  isTokenAccount: jest.fn(),
}));

const { isTokenAccount } = jest.requireMock("@ledgerhq/live-common/account/index");

describe("buildSellNavigationState", () => {
  const mockLedgerCurrency = { id: "ethereum" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return state with currency and mode when no account is provided", () => {
    const result = buildSellNavigationState({
      ledgerCurrency: mockLedgerCurrency as never,
    });

    expect(result).toEqual({
      currency: "ethereum",
      mode: "sell",
    });
    expect(result.account).toBeUndefined();
    expect(isTokenAccount).not.toHaveBeenCalled();
  });

  it("should include account id when account is a main account", () => {
    (isTokenAccount as jest.Mock).mockReturnValue(false);
    const mockAccount = { id: "account-123" };

    const result = buildSellNavigationState({
      ledgerCurrency: mockLedgerCurrency as never,
      account: mockAccount as never,
    });

    expect(result).toEqual({
      currency: "ethereum",
      account: "account-123",
      mode: "sell",
    });
    expect(isTokenAccount).toHaveBeenCalledWith(mockAccount);
  });

  it("should use parentAccount id when account is a token account and parentAccount is provided", () => {
    (isTokenAccount as jest.Mock).mockReturnValue(true);
    const mockTokenAccount = { id: "token-account-456", parentId: "parent-789" };
    const mockParentAccount = { id: "parent-789" };

    const result = buildSellNavigationState({
      ledgerCurrency: mockLedgerCurrency as never,
      account: mockTokenAccount as never,
      parentAccount: mockParentAccount as never,
    });

    expect(result).toEqual({
      currency: "ethereum",
      account: "parent-789",
      mode: "sell",
    });
    expect(isTokenAccount).toHaveBeenCalledWith(mockTokenAccount);
  });

  it("should use account parentId when account is a token account but parentAccount is not provided", () => {
    (isTokenAccount as jest.Mock).mockReturnValue(true);
    const mockTokenAccount = { id: "token-account-456", parentId: "parent-from-token" };

    const result = buildSellNavigationState({
      ledgerCurrency: mockLedgerCurrency as never,
      account: mockTokenAccount as never,
    });

    expect(result).toEqual({
      currency: "ethereum",
      account: "parent-from-token",
      mode: "sell",
    });
  });
});
