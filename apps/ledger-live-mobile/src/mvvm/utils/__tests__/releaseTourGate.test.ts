import { isQ2ReleaseTourEnabled, isQ3ReleaseTourEnabled } from "../releaseTourGate";

describe("releaseTourGate", () => {
  it("treats a missing or disabled flag as off", () => {
    expect(isQ2ReleaseTourEnabled(undefined)).toBe(false);
    expect(isQ3ReleaseTourEnabled(undefined)).toBe(false);
    expect(isQ2ReleaseTourEnabled({ enabled: false, params: { variant: "q2" } })).toBe(false);
    expect(isQ3ReleaseTourEnabled({ enabled: false, params: { variant: "q3_a" } })).toBe(false);
  });

  it("enables Q2 only for variant q2", () => {
    expect(isQ2ReleaseTourEnabled({ enabled: true, params: { variant: "q2" } })).toBe(true);
    expect(isQ2ReleaseTourEnabled({ enabled: true, params: { variant: "q3_a" } })).toBe(false);
    expect(isQ2ReleaseTourEnabled({ enabled: true, params: {} })).toBe(false);
  });

  it("enables Q3 for q3_a, q3_b, and q3_b2", () => {
    expect(isQ3ReleaseTourEnabled({ enabled: true, params: { variant: "q3_a" } })).toBe(true);
    expect(isQ3ReleaseTourEnabled({ enabled: true, params: { variant: "q3_b" } })).toBe(true);
    expect(isQ3ReleaseTourEnabled({ enabled: true, params: { variant: "q3_b2" } })).toBe(true);
    expect(isQ3ReleaseTourEnabled({ enabled: true, params: { variant: "q2" } })).toBe(false);
    expect(isQ3ReleaseTourEnabled({ enabled: true, params: {} })).toBe(false);
  });
});
