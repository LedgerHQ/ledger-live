jest.mock("styled-components/native", () => ({
  useTheme: jest.fn(() => ({})),
}));

describe("useTheme (native)", () => {
  it("re-exports useTheme from styled-components/native", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useTheme } = require("../useTheme.native");
    expect(typeof useTheme).toBe("function");
  });
});
