// styled-components/native pulls in the React Native runtime, which this jsdom project can't
// load; the sibling StyleProvider.native test mocks it the same way.
jest.mock("styled-components/native", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createContext } = require("react");
  return { ThemeContext: createContext(undefined) };
});

import React from "react";
import { renderHook } from "@testing-library/react";
import { ThemeContext } from "styled-components/native";
import { useThemeVariant } from "../useThemeVariant.native";

describe("useThemeVariant (native)", () => {
  it.each(["light", "dark"] as const)("reads %s from the mounted provider", variant => {
    const { result } = renderHook(() => useThemeVariant(), {
      wrapper: ({ children }) =>
        React.createElement(
          ThemeContext.Provider,
          { value: { theme: variant } as never },
          children,
        ),
    });

    expect(result.current).toBe(variant);
  });

  it("falls back to light with no provider mounted", () => {
    const { result } = renderHook(() => useThemeVariant());

    expect(result.current).toBe("light");
  });
});
