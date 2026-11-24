import { predictionsOrderResultTone } from "./predictionsOrderResult";

describe("predictionsOrderResultTone", () => {
  it.each([
    [{ status: "filled" }, "success"],
    [{ status: "not-filled" }, "error"],
    [{ status: "rejected", reason: "market-closed" }, "error"],
    [{ status: "unconfirmed" }, "info"],
  ] as const)("gives %p the %s tone", (report, tone) => {
    expect(predictionsOrderResultTone(report)).toBe(tone);
  });
});
