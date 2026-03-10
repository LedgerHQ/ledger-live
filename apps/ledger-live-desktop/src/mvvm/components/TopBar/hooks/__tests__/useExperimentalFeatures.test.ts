import { Experiment } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useExperimentalFeatures } from "../useExperimentalFeatures";
import { useNavigate, useLocation } from "react-router";
import useExperimental from "~/renderer/hooks/useExperimental";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("~/renderer/hooks/useExperimental");

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);
const mockUseExperimental = jest.mocked(useExperimental);

const createLocation = (pathname: string) => ({
  pathname,
  state: null,
  key: "default",
  search: "",
  hash: "",
});

describe("useExperimentalFeatures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/"));
    mockUseExperimental.mockReturnValue(false);
  });

  it("returns handleExperimental, icon, and translated tooltip", () => {
    const { result } = renderHook(() => useExperimentalFeatures());

    expect(result.current.handleExperimental).toBeDefined();
    expect(typeof result.current.handleExperimental).toBe("function");
    expect(result.current.icon).toBe(Experiment);
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
  });

  it("returns isVisible false when no experimental features are enabled", () => {
    mockUseExperimental.mockReturnValue(false);

    const { result } = renderHook(() => useExperimentalFeatures());

    expect(result.current.isVisible).toBe(false);
  });

  it("returns isVisible true when experimental features are enabled", () => {
    mockUseExperimental.mockReturnValue(true);

    const { result } = renderHook(() => useExperimentalFeatures());

    expect(result.current.isVisible).toBe(true);
  });

  it("navigates to /settings/experimental when not already on that page", () => {
    mockUseLocation.mockReturnValue(createLocation("/accounts"));

    const { result } = renderHook(() => useExperimentalFeatures());

    act(() => {
      result.current.handleExperimental();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/settings/experimental");
  });

  it("does not navigate when already on /settings/experimental", () => {
    mockUseLocation.mockReturnValue(createLocation("/settings/experimental"));

    const { result } = renderHook(() => useExperimentalFeatures());

    act(() => {
      result.current.handleExperimental();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
