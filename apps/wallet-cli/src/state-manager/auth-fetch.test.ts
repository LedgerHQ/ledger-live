import { describe, expect, it } from "bun:test";
import { excludeFromAuthDeadline } from "./auth-fetch";

describe("excludeFromAuthDeadline", () => {
  it("rejects an async load, whose time it could not measure", () => {
    // @ts-expect-error the time is measured around the call, so load must block synchronously
    const load = excludeFromAuthDeadline(async () => 42);
    expect(load).toThrow(TypeError);
  });
});
