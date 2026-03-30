import { renderHook, act } from "@testing-library/react-native";
import { track } from "~/analytics";
import { useAddAccountCta } from "../useAddAccountCta";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

describe("useAddAccountCta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start with isOpen false", () => {
    const { result } = renderHook(() => useAddAccountCta());
    expect(result.current.isOpen).toBe(false);
  });

  it("should set isOpen to true when open is called", () => {
    const { result } = renderHook(() => useAddAccountCta());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should set isOpen back to false when close is called", () => {
    const { result } = renderHook(() => useAddAccountCta());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("should fire track exactly once when open is called", () => {
    const { result } = renderHook(() => useAddAccountCta());

    act(() => {
      result.current.open();
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", { button: "add_account_cta" });
  });

  it("should not fire track when close is called", () => {
    const { result } = renderHook(() => useAddAccountCta());

    act(() => {
      result.current.open();
    });
    (track as jest.Mock).mockClear();

    act(() => {
      result.current.close();
    });

    expect(track).not.toHaveBeenCalled();
  });
});
