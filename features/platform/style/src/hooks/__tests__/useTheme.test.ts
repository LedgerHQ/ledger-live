describe("useTheme (web)", () => {
  it("re-exports useTheme from styled-components", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useTheme } = require("../useTheme");
    expect(typeof useTheme).toBe("function");
  });
});
