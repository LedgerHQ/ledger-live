import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { useBorrowEntryPointViewModel } from "../useBorrowEntryPointViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/portfolio" }),
}));

describe("useBorrowEntryPointViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to /borrow with the current pathname as returnTo when handleClick is called", () => {
    const { result } = renderHook(() => useBorrowEntryPointViewModel());

    act(() => {
      result.current.handleClick();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/borrow", {
      state: { returnTo: "/portfolio" },
    });
  });

  it("should track a button_clicked event with portfolio metadata when handleClick is called", () => {
    const { result } = renderHook(() => useBorrowEntryPointViewModel());

    act(() => {
      result.current.handleClick();
    });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: "Portfolio",
    });
  });
});
