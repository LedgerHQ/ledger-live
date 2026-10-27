import { useTheme } from "../useTheme";

describe("useTheme (web)", () => {
  it("re-exports useTheme from styled-components", () => {
    expect(typeof useTheme).toBe("function");
  });
});
