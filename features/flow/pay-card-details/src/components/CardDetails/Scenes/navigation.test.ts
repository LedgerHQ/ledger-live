import { act, renderHook } from "@testing-library/react";
import { useCardDetailsNavigation } from "./navigation";

describe("useCardDetailsNavigation", () => {
  it("should start on the overview scene", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should replace the current scene when going to another one", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "freeze" }));
    expect(result.current.route).toEqual({ name: "freeze" });

    act(() => result.current.goTo({ name: "more" }));
    expect(result.current.route).toEqual({ name: "more" });
  });

  it("should return to overview on goBack", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goTo({ name: "more" }));
    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "overview" });
  });

  it("should keep a stable overview when going back from overview", () => {
    const { result } = renderHook(() => useCardDetailsNavigation());

    act(() => result.current.goBack());

    expect(result.current.route).toEqual({ name: "overview" });
  });
});
