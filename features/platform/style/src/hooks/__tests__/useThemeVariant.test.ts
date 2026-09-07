import React from "react";
import { renderHook } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { resolveThemeVariant } from "../resolveThemeVariant";
import { useThemeVariant } from "../useThemeVariant";

describe("resolveThemeVariant", () => {
  it("returns dark for a dark theme", () => {
    expect(resolveThemeVariant({ theme: "dark" })).toBe("dark");
  });

  it.each([[undefined], [null], [{}], [{ theme: undefined }], [{ theme: "unexpected" }]])(
    "falls back to light for %p",
    theme => {
      expect(resolveThemeVariant(theme)).toBe("light");
    },
  );
});

describe("useThemeVariant (web)", () => {
  it.each(["light", "dark"] as const)("reads %s from the mounted provider", variant => {
    const { result } = renderHook(() => useThemeVariant(), {
      wrapper: ({ children }) =>
        React.createElement(ThemeProvider, { theme: { theme: variant } }, children),
    });

    expect(result.current).toBe(variant);
  });

  // useTheme throws without a provider; this hook must not, so a consumer stays renderable alone.
  it("falls back to light with no provider mounted", () => {
    const { result } = renderHook(() => useThemeVariant());

    expect(result.current).toBe("light");
  });
});
