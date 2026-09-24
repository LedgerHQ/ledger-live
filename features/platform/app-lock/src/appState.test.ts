import { isAppBackgrounded } from "./appState";

describe("isAppBackgrounded", () => {
  it.each([
    ["background", true],
    ["inactive", false],
    ["active", false],
  ])("on ios treats %s as backgrounded: %s", (state, expected) => {
    expect(isAppBackgrounded(state, "ios")).toBe(expected);
  });

  it.each([
    ["background", true],
    ["inactive", true],
    ["active", false],
  ])("on android treats %s as backgrounded: %s", (state, expected) => {
    expect(isAppBackgrounded(state, "android")).toBe(expected);
  });

  it("does not lock ios for the prompts that only cover the app", () => {
    expect(isAppBackgrounded("inactive", "ios")).toBe(false);
  });
});
