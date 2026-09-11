import React from "react";
import { MemoryRouter } from "react-router";
import { renderHook } from "tests/testSetup";
import { useCardViewModel } from "../useCardViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

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
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("hands the Card login the code the deep link brought", () => {
    const { result } = renderCardViewModel({ code: "auth-code" });

    expect(result.current.callback).toEqual({ code: "auth-code" });
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("hands it the attempt state alongside the code, when the deep link carried one", () => {
    renderCardViewModel({ code: "auth-code", state: "attempt-state" });

    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
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

  it("clears the router state once the callback has been read, so a later remount cannot replay it", () => {
    renderCardViewModel({ code: "auth-code" });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("leaves the router state alone when there is nothing to clear", () => {
    renderCardViewModel(null);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
