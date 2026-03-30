import { Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useHistory } from "../useHistory";
import { useNavigate, useLocation } from "react-router";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

const createLocation = (pathname: string) => ({
  pathname,
  state: null,
  key: "default",
  search: "",
  hash: "",
});

describe("useHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/history"));
  });

  it("returns handleHistory, historyIcon, tooltip, and cta", () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.handleHistory).toBeDefined();
    expect(result.current.historyIcon).toBe(Clock);
    expect(result.current.tooltip).toBeDefined();
    expect(result.current.cta).toBeDefined();
  });

  it("navigates to /history and sets tracking source when not already on history page", () => {
    mockUseLocation.mockReturnValueOnce(createLocation("/accounts"));

    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.handleHistory();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/history");
  });

  it("does not navigate when already on history page", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.handleHistory();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
