import { Tools } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useFeatureFlags } from "../useFeatureFlags";
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

describe("useFeatureFlags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/"));
  });

  it("returns handleFeatureFlags, icon, and translated tooltip", () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.handleFeatureFlags).toBeDefined();
    expect(typeof result.current.handleFeatureFlags).toBe("function");
    expect(result.current.icon).toBe(Tools);
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
  });

  it("returns isVisible false when button is not visible and no overridden flags", () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      initialState: {
        settings: {
          featureFlagsButtonVisible: false,
          overriddenFeatureFlags: {},
        },
      },
    });

    expect(result.current.isVisible).toBe(false);
  });

  it("returns isVisible true when featureFlagsButtonVisible is true", () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      initialState: {
        settings: {
          featureFlagsButtonVisible: true,
          overriddenFeatureFlags: {},
        },
      },
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("returns isVisible true when overridden feature flags exist", () => {
    const { result } = renderHook(() => useFeatureFlags(), {
      initialState: {
        settings: {
          featureFlagsButtonVisible: false,
          overriddenFeatureFlags: { currencyAvalancheCChain: { enabled: true } },
        },
      },
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("navigates to /settings/developer when not already on that page", () => {
    mockUseLocation.mockReturnValue(createLocation("/accounts"));

    const { result } = renderHook(() => useFeatureFlags());

    act(() => {
      result.current.handleFeatureFlags();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/settings/developer");
  });

  it("does not navigate when already on /settings/developer", () => {
    mockUseLocation.mockReturnValue(createLocation("/settings/developer"));

    const { result } = renderHook(() => useFeatureFlags());

    act(() => {
      result.current.handleFeatureFlags();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
