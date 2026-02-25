import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useSettings } from "../useSettings";
import { useNavigate, useLocation } from "react-router";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);
const mockSetTrackingSource = jest.mocked(setTrackingSource);

const createLocation = (pathname: string) => ({
  pathname,
  state: null,
  key: "default",
  search: "",
  hash: "",
});

describe("useSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/"));
  });

  it("returns handleSettings, settingsIcon, and translated tooltip", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.handleSettings).toBeDefined();
    expect(typeof result.current.handleSettings).toBe("function");
    expect(result.current.settingsIcon).toBe(Settings);
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
  });

  it("navigates to /settings and sets tracking source when not already on settings page", () => {
    mockUseLocation.mockReturnValue(createLocation("/accounts"));

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.handleSettings();
    });

    expect(mockSetTrackingSource).toHaveBeenCalledWith("topbar");
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });

  it("does not navigate when already on settings page", () => {
    mockUseLocation.mockReturnValue(createLocation("/settings"));

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.handleSettings();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockSetTrackingSource).not.toHaveBeenCalled();
  });
});
