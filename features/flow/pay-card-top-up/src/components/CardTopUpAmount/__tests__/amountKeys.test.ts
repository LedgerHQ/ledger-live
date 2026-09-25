import { AMOUNT_DELETE_KEY, applyAmountKey } from "../amountKeys";

describe("applyAmountKey", () => {
  it.each([
    ["appends a digit", "12", "3", 2, "123"],
    ["replaces a lone zero", "0", "5", 2, "5"],
    ["removes the last character", "12.5", AMOUNT_DELETE_KEY, 2, "12."],
    ["starts a decimal from empty text", "", ".", 2, "0."],
    ["ignores a second decimal separator", "1.2", ".", 2, "1.2"],
    ["ignores a decimal separator for a unit without decimals", "12", ".", 0, "12"],
    ["stops at the unit precision", "1.25", "9", 2, "1.25"],
    ["stops at nine integer digits", "123456789", "0", 2, "123456789"],
  ])("%s", (_case, currentText, key, maxDecimals, expected) => {
    expect(applyAmountKey(currentText, key, maxDecimals)).toBe(expected);
  });
});
