import React from "react";
import { MemoryRouter } from "react-router";
import { renderHook } from "tests/testSetup";
import { useCardViewModel } from "../useCardViewModel";

// The harness router takes a path only, and this view model reads router state.
function atPayTabWith(state: unknown) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[{ pathname: "/paytab", state }]}>{children}</MemoryRouter>
    );
  };
}

function renderCardViewModel(state: unknown) {
  return renderHook(() => useCardViewModel(), {
    skipRouter: true,
    wrapper: atPayTabWith(state),
  });
}

describe("useCardViewModel", () => {
  it("hands the Card login the code the deep link brought", () => {
    const { result } = renderCardViewModel({ code: "auth-code" });

    expect(result.current.callback).toEqual({ code: "auth-code" });
  });

  it("hands it the attempt state alongside the code, when the deep link carried one", () => {
    const { result } = renderCardViewModel({ code: "auth-code", state: "attempt-state" });

    expect(result.current.callback).toEqual({ code: "auth-code", state: "attempt-state" });
  });

  it("hands it no callback when the deep link brought no code", () => {
    const { result } = renderCardViewModel(null);

    expect(result.current.callback).toBeNull();
  });

  it.each([{ code: "" }, { code: 42 }, { other: "value" }])(
    "hands it no callback for the state %p",
    state => {
      const { result } = renderCardViewModel(state);

      expect(result.current.callback).toBeNull();
    },
  );
});
