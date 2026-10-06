import { formatDuration, shorten, summaryLine } from "./AccountDiscovery.internals";

describe("AccountDiscovery internals", () => {
  it("formats a duration under and over a second", () => {
    expect(formatDuration(240.4)).toBe("240 ms");
    expect(formatDuration(1520)).toBe("1.5 s");
  });

  it("shortens only what is long", () => {
    expect(shorten("0xabc")).toBe("0xabc");
    expect(shorten("0123456789abcdefghijklmnopqrstuvwxyz", 4)).toBe("0123…wxyz");
  });

  it("summarises the scan", () => {
    const row = {
      key: "k",
      derivationMode: "",
      index: 0,
      used: true,
      address: "a",
      path: "m/0",
      foundAtMs: 1,
    };
    expect(
      summaryLine({
        status: "done",
        rows: [row, { ...row, key: "k2", used: false }],
        counters: { derivations: 3, existenceChecks: 1 },
        elapsedMs: 2100,
      }),
    ).toBe("1 used account · 3 derivations, 1 existence check · 2.1 s");
  });
});
