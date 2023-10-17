import { getExchangeErrorMessage } from "./ReturnCode";

describe("getExchageErrorMessage", () => {
  it("returns the related message", () => {
    // When
    const result = getExchangeErrorMessage(0x6a80);

    // Then
    expect(result).toBe("Incorrect command data");
  });
  it("returns undefined if the value is unknown", () => {
    // When
    const result = getExchangeErrorMessage(0x6a77);

    // Then
    expect(result).toBeUndefined();
  });
});
