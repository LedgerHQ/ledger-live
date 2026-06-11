import { act, renderHook } from "tests/testSetup";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { useTransactionsSectionViewModel } from "../useTransactionsSectionViewModel";

const mockNavigate = jest.fn();
const btc = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/asset/bitcoin" }),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

describe("useTransactionsSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns not visible when no operations are available", () => {
    const account = genAccount("btc-root-empty", { currency: btc, operationsSize: 0 });
    const distributionItem = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useTransactionsSectionViewModel(distributionItem), {
      initialState: { accounts: [account] },
    });

    expect(result.current.visible).toBe(false);
    expect(result.current.table.getRowModel().rows).toHaveLength(0);
  });

  it("returns at most 3 recent rows and visible=true when operations exist", () => {
    const account = genAccount("btc-root-many", { currency: btc, operationsSize: 4 });
    const distributionItem = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useTransactionsSectionViewModel(distributionItem), {
      initialState: { accounts: [account] },
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.table.getRowModel().rows).toHaveLength(3);
  });

  it("tracks and opens operation details when a row is clicked", () => {
    const account = genAccount("btc-root-click", { currency: btc, operationsSize: 2 });
    const distributionItem = buildDistributionItem({ currency: btc, accounts: [account] });

    const { result } = renderHook(() => useTransactionsSectionViewModel(distributionItem), {
      initialState: { accounts: [account] },
    });

    const row = result.current.table.getRowModel().rows[0];
    const { operation } = row.original;

    act(() => {
      result.current.onRowClick(row);
    });

    expect(track).toHaveBeenCalledWith("transaction_clicked", {
      transaction: operation.type,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      currency: "bitcoin",
    });
    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: undefined,
    });
  });

  it("when distribution lists only one token account, preview rows exclude sibling tokens and native ops", () => {
    const ethRoot = genAccount("eth-prev-scope", {
      currency: ethereumCurrency,
      subAccountsCount: 0,
      operationsSize: 2,
    });
    const usdc = genTokenAccount(0, ethRoot, usdcToken);
    const matic = genTokenAccount(1, ethRoot, maticEth);
    const ethTree = { ...ethRoot, subAccounts: [usdc, matic] };

    const distributionItem = buildDistributionItem({
      currency: usdcToken,
      accounts: [usdc],
    });

    const { result } = renderHook(() => useTransactionsSectionViewModel(distributionItem), {
      initialState: { accounts: [ethTree] },
    });

    expect(result.current.visible).toBe(true);
    const rows = result.current.table.getRowModel().rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.original.account.id === usdc.id)).toBe(true);
  });

  it("navigates to history with accountIds and back path when see all is called", () => {
    const account1 = genAccount("btc-root-1", { currency: btc });
    const account2 = genAccount("btc-root-2", { currency: btc });
    const distributionItem = buildDistributionItem({
      currency: btc,
      accounts: [account1, account2],
    });

    const { result } = renderHook(() => useTransactionsSectionViewModel(distributionItem), {
      initialState: { accounts: [account1, account2] },
    });

    act(() => {
      result.current.onSeeAll();
    });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Transactions",
      currency: "bitcoin",
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      `/history?accountIds=${encodeURIComponent(`${account1.id},${account2.id}`)}`,
      { state: { historyBackPath: "/asset/bitcoin" } },
    );
  });
});
