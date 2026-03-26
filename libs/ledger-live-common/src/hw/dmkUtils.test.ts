import { isDmkTransport } from "./dmkUtils";

describe("isDmkTransport", () => {
  it("returns true when transport has dmk and sessionId", () => {
    const transport = { dmk: {}, sessionId: "abc123" } as any;
    expect(isDmkTransport(transport)).toBe(true);
  });

  it("returns false when transport is missing dmk", () => {
    const transport = { sessionId: "abc123" } as any;
    expect(isDmkTransport(transport)).toBe(false);
  });

  it("returns false when transport is missing sessionId", () => {
    const transport = { dmk: {} } as any;
    expect(isDmkTransport(transport)).toBe(false);
  });
});
