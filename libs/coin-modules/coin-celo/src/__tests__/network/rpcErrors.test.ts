import { isRevertLike } from "../../network/rpcErrors";

describe("isRevertLike", () => {
  it.each([
    "execution reverted",
    "Error: execution error",
    "out of gas",
    "invalid opcode",
    "VM Exception: revert",
  ])("classifies %p as revert-like", message => {
    expect(isRevertLike(new Error(message))).toBe(true);
  });

  it.each([
    "connection timeout",
    "request timed out",
    "ECONNREFUSED",
    "socket hang up",
    "network error",
    "fetch failed",
    "request failed with status 429",
  ])("classifies transient failure %p as NOT revert-like", message => {
    expect(isRevertLike(new Error(message))).toBe(false);
  });

  it("does not mask a transient failure whose message also mentions a revert", () => {
    expect(isRevertLike(new Error("request failed: execution reverted"))).toBe(false);
  });

  it("handles non-Error values", () => {
    expect(isRevertLike("plain reverted string")).toBe(true);
    expect(isRevertLike(undefined)).toBe(false);
  });
});
