import { KEYPAD_DELETE_KEY } from "LLM/components/AmountKeypad";
import { applyAmountKey, toAmountText } from "../amountKeys";

describe("applyAmountKey", () => {
  it("appends digits and replaces a lone zero", () => {
    expect(applyAmountKey("0", "5", 2)).toBe("5");
    expect(applyAmountKey("5", "0", 2)).toBe("50");
  });

  it("adds one decimal separator only", () => {
    expect(applyAmountKey("", ".", 2)).toBe("0.");
    expect(applyAmountKey("1.", ".", 2)).toBe("1.");
  });

  it("stops at the allowed precision", () => {
    expect(applyAmountKey("1.23", "4", 2)).toBe("1.23");
  });

  it("deletes the last character", () => {
    expect(applyAmountKey("12", KEYPAD_DELETE_KEY, 2)).toBe("1");
  });
});

describe("toAmountText", () => {
  it("rounds down to the allowed precision", () => {
    expect(toAmountText(999.555, 2)).toBe("999.55");
  });

  it("renders zero as empty", () => {
    expect(toAmountText(0, 2)).toBe("");
  });
});
