import { renderHook } from "@testing-library/react";
import { useMyAccountsSectionViewModel } from "../useMyAccountsSectionViewModel";
import { useSelector } from "LLD/hooks/redux";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";

jest.mock("LLD/hooks/redux");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor");
jest.mock("~/renderer/reducers/wallet");

const mockedUseSelector = jest.mocked(useSelector);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedSendFeatures = jest.mocked(sendFeatures);
const mockedUseBatchMaybeAccountName = jest.mocked(useBatchMaybeAccountName);

describe("useMyAccountsSectionViewModel", () => {
  const mockCurrency = createMockCurrency();
  const currentAccountId = "account_1";

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountCurrency.mockImplementation(acc => {
      if (!acc) return mockCurrency;
      return "currency" in acc ? acc.currency : mockCurrency;
    });
    mockedUseBatchMaybeAccountName.mockReturnValue([]);
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");
  });

  it("filters accounts by currency and excludes current account", () => {
    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });
    const account3 = createMockAccount({
      id: "account_3",
      currency: createMockCurrency({ id: "ethereum" }),
    });

    mockedUseSelector.mockReturnValue([account1, account2, account3]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(1);
    expect(result.current.userAccountsForCurrency[0].id).toBe("account_2");
  });

  it("returns empty array when no matching accounts", () => {
    const account1 = createMockAccount({ id: "account_1" });

    mockedUseSelector.mockReturnValue([account1]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(0);
  });

  it("returns account names for filtered accounts", () => {
    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });
    const account3 = createMockAccount({ id: "account_3" });

    mockedUseSelector.mockReturnValue([account1, account2, account3]);
    mockedUseBatchMaybeAccountName.mockReturnValue(["Name 2", "Name 3"]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.accountNames).toEqual(["Name 2", "Name 3"]);
  });

  it("handles multiple accounts with same currency", () => {
    const accounts = [
      createMockAccount({ id: "account_1" }),
      createMockAccount({ id: "account_2" }),
      createMockAccount({ id: "account_3" }),
      createMockAccount({ id: "account_4" }),
    ];

    mockedUseSelector.mockReturnValue(accounts);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(3);
    expect(result.current.userAccountsForCurrency.map(acc => acc.id)).toEqual([
      "account_2",
      "account_3",
      "account_4",
    ]);
  });

  it("updates when accounts change", () => {
    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });

    mockedUseSelector.mockReturnValue([account1]);

    const { result, rerender } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(0);

    mockedUseSelector.mockReturnValue([account1, account2]);
    rerender();

    expect(result.current.userAccountsForCurrency).toHaveLength(1);
    expect(result.current.userAccountsForCurrency[0].id).toBe("account_2");
  });

  it("includes current account when self-transfer is allowed (free)", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("free");

    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });

    mockedUseSelector.mockReturnValue([account1, account2]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(2);
    expect(result.current.userAccountsForCurrency.map(acc => acc.id)).toEqual([
      "account_1",
      "account_2",
    ]);
  });

  it("includes current account when self-transfer is allowed (warning)", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("warning");

    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });

    mockedUseSelector.mockReturnValue([account1, account2]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(2);
    expect(result.current.userAccountsForCurrency.map(acc => acc.id)).toEqual([
      "account_1",
      "account_2",
    ]);
  });

  it("excludes current account when self-transfer is impossible", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");

    const account1 = createMockAccount({ id: "account_1" });
    const account2 = createMockAccount({ id: "account_2" });

    mockedUseSelector.mockReturnValue([account1, account2]);

    const { result } = renderHook(() =>
      useMyAccountsSectionViewModel({
        currency: mockCurrency,
        currentAccountId,
      }),
    );

    expect(result.current.userAccountsForCurrency).toHaveLength(1);
    expect(result.current.userAccountsForCurrency[0].id).toBe("account_2");
  });
});
