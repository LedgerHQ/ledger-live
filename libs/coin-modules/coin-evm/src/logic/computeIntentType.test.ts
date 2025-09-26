import { computeIntentType } from "./computeIntentType";

describe("computeIntentType", () => {
  it.each([
    ["send-eip1559", "a 'send-eip1559' mode", { mode: "send-eip1559" }],
    ["send-eip1559", "a 'send' mode and '2' type", { mode: "send", type: 2 }],
    ["send-legacy", "a 'send-legacy' mode", { mode: "send-legacy" }],
    ["send-legacy", "a 'send' mode and '0' type", { mode: "send", type: 0 }],
    ["send-legacy", "a 'send' mode no type", { mode: "send" }],
  ])("detects a '%s' type from %s", (expectedType, _s, transaction) => {
    expect(computeIntentType(transaction)).toEqual(expectedType);
  });

  it("throws on unsupported transaction mode", () => {
    expect(() => computeIntentType({ mode: undefined })).toThrow(
      "Unsupported transaction mode: undefined",
    );
    expect(() => computeIntentType({ mode: "any" })).toThrow("Unsupported transaction mode: 'any'");
  });
});
