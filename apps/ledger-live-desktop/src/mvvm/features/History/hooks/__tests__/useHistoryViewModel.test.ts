import { renderHook, act, waitFor, withFlagOverrides } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Operation } from "@ledgerhq/types-live";
import { useNavigate, useLocation } from "react-router";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { useHistoryViewModel } from "../useHistoryViewModel";
import { track } from "@shared/analytics";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockHistoryOperations = jest.fn();
jest.mock("../useHistoryOperations", () => ({
  useHistoryOperations: () => mockHistoryOperations(),
}));

jest.mock("../useHistoryTable", () => ({
  useHistoryTable: () => ({
    getRowModel: () => ({ rows: [] }),
    getHeaderGroups: () => [],
  }),
}));

jest.mock("../useHistoryVirtualization", () => ({
  useHistoryVirtualization: () => ({
    parentRef: { current: null },
    rowVirtualizer: { getVirtualItems: () => [], getTotalSize: () => 0 },
    flatItems: [],
  }),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

describe("useHistoryViewModel navigateBack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHistoryOperations.mockReturnValue([]);
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      pathname: "/history",
      state: null,
      key: "default",
      search: "",
      hash: "",
    });
  });

  it("shows back button and pops the stack when historyBackPath is set", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/history",
      state: { historyBackPath: "/asset/bitcoin" },
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useHistoryViewModel());

    expect(result.current.showBackButton).toBe(true);

    act(() => {
      result.current.navigateBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("hides back button when historyBackPath is missing", () => {
    const { result } = renderHook(() => useHistoryViewModel());

    expect(result.current.showBackButton).toBe(false);
  });

  it("opens operation details with the operation hash when a row is clicked", () => {
    const account = genAccount("history-row", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 0,
    });
    const operation = { id: "operation-id", hash: "operation-hash", type: "OUT" } as Operation;
    const row = {
      original: { operation, account, parentAccount: undefined },
    } as Parameters<ReturnType<typeof useHistoryViewModel>["onRowClick"]>[0];
    const { result } = renderHook(() => useHistoryViewModel());

    act(() => {
      result.current.onRowClick(row);
    });

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: operation.id,
      hash: operation.hash,
      accountId: account.id,
      parentId: undefined,
    });
  });

  it("should format the dust filter threshold in USD without a reference conversion", () => {
    const { result } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "USD", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.dustFilterThreshold).toBe("US$0.01");
  });

  it("should request USD countervalue tracking when the dust filter option is shown for a non-USD countervalue", async () => {
    const { store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "EUR", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    await waitFor(() =>
      expect(store.getState().countervaluesExtraTracking.extraTrackingPairs).toEqual([
        expect.objectContaining({
          from: expect.objectContaining({ ticker: "USD" }),
          to: expect.objectContaining({ ticker: "EUR" }),
        }),
      ]),
    );
  });

  it("should not request USD countervalue tracking when the dust filter option is hidden", () => {
    const { store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "EUR", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: false } }),
      },
    });

    expect(store.getState().countervaluesExtraTracking.extraTrackingPairs).toEqual([]);
  });

  it("should track the target dust filter state when toggling dust filtering", () => {
    const { result, store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { hideSmallValueTokenOperations: false },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    act(() => {
      result.current.onToggleHideSmallValueTokenOperations();
    });

    expect(store.getState().settings.hideSmallValueTokenOperations).toBe(true);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "dust_filter",
      enabled: true,
    });

    act(() => {
      result.current.onToggleHideSmallValueTokenOperations();
    });

    expect(store.getState().settings.hideSmallValueTokenOperations).toBe(false);
    expect(track).toHaveBeenLastCalledWith("button_clicked", {
      button: "dust_filter",
      enabled: false,
    });
  });
});
