import { act, renderHook } from "tests/testSetup";
import { useLocation, useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { useAccountBackNavigation } from "../useAccountBackNavigation";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

describe("useAccountBackNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  it("shows back button and pops the stack when accountBackPath is set", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/account/abc",
      state: { accountBackPath: "/asset/bitcoin" },
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useAccountBackNavigation());

    expect(result.current.showBackButton).toBe(true);

    act(() => {
      result.current.navigateBack();
    });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Back",
      page: "Page Account",
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("hides back button when accountBackPath points to another account page", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/account/abc",
      state: { accountBackPath: "/account/xyz" },
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useAccountBackNavigation());

    expect(result.current.showBackButton).toBe(false);
  });

  it("hides back button when accountBackPath is missing", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/account/abc",
      state: null,
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useAccountBackNavigation());

    expect(result.current.showBackButton).toBe(false);
  });
});
