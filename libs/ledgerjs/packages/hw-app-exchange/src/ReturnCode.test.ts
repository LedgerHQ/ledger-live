import { getExchangeErrorMessage } from "./ReturnCode";

describe("getExchageErrorMessage", () => {
  it("returns the related message", () => {
    // When
    const result = getExchangeErrorMessage(0x6a80);

    // Then
    expect(result).toBe({
      errorMessage: "Incorrect command data",
      errorName: "incorrectCommandData",
    });
  });
  it("returns undefined if the value is unknown", () => {
    // When
    const result = getExchangeErrorMessage(0x6a77);

    // Then
    expect(result).toBe({ errorMessage: undefined, errorName: undefined });
  });
});
