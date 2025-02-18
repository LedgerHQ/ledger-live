import { shouldFilterOperation } from "../components/OperationWrapper";

describe("OperationWrapper", () => {
  it("shouldFilterOperation correctly determines filtering", () => {
    expect(
      shouldFilterOperation({ enabled: true }, { enabled: true, params: { threshold: 40 } }, 50),
    ).toBe(true);
    expect(
      shouldFilterOperation({ enabled: true }, { enabled: true, params: { threshold: 40 } }, 30),
    ).toBe(false);
    expect(
      shouldFilterOperation({ enabled: false }, { enabled: true, params: { threshold: 40 } }, 50),
    ).toBe(false);
    expect(shouldFilterOperation({ enabled: true }, null, 50)).toBe(false);
  });
});
