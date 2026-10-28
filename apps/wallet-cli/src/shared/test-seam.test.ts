import { describe, expect, it } from "bun:test";
import { createTestSeam, resetTestSeams } from "./test-seam";

describe("createTestSeam", () => {
  it("serves the real dependency until a test replaces it, and returns what each set drops", () => {
    const seam = createTestSeam("real");

    expect(seam.get()).toBe("real");
    expect(seam.set("fake")).toBeNull();
    expect(seam.get()).toBe("fake");
    expect(seam.set(null)).toBe("fake");
    expect(seam.get()).toBe("real");
  });
});

describe("resetTestSeams", () => {
  it("restores every seam, even past one that refuses, then rethrows the refusal", () => {
    const refusal = new Error("refused");
    let refuse = false;
    const first = createTestSeam("real", () => {
      if (refuse) throw refusal;
    });
    const second = createTestSeam("real");
    first.set("fake");
    second.set("fake");
    refuse = true;

    expect(() => resetTestSeams()).toThrow(refusal);
    expect(second.get()).toBe("real");

    refuse = false;
    resetTestSeams();
    expect(first.get()).toBe("real");
  });
});
