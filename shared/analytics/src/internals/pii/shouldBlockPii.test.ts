import { shouldBlockPii } from "./shouldBlockPii";

declare const process: { env: { NODE_ENV?: string } };

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe("shouldBlockPii", () => {
  it.each(["development", "test"])("blocks in %s", nodeEnv => {
    process.env.NODE_ENV = nodeEnv;

    expect(shouldBlockPii()).toBe(true);
  });

  it.each(["production", "staging", ""])("redacts when NODE_ENV is %p", nodeEnv => {
    process.env.NODE_ENV = nodeEnv;

    expect(shouldBlockPii()).toBe(false);
  });

  it("redacts when NODE_ENV is not set", () => {
    delete process.env.NODE_ENV;

    expect(shouldBlockPii()).toBe(false);
  });
});
