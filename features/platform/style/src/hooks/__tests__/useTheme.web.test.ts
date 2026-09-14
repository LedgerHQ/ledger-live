import { useTheme } from "../useTheme.web";

describe("useTheme (web)", () => {
  it("re-exports useTheme from styled-components", () => {
    expect(typeof useTheme).toBe("function");
  });
});
