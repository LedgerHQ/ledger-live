import { renderHook, act } from "tests/testSetup";
import { useNavigate, useLocation } from "react-router";
import { useHistoryViewModel } from "../useHistoryViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("../useHistoryOperations", () => ({
  useHistoryOperations: () => [],
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

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

describe("useHistoryViewModel navigateBack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
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
    mockUseLocation.mockReturnValue({
      pathname: "/history",
      state: null,
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useHistoryViewModel());

    expect(result.current.showBackButton).toBe(false);
  });
});
