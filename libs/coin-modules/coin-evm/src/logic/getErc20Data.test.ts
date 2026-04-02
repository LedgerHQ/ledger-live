import { getErc20Data } from "./getErc20Data";

describe("getErc20Data", () => {
  it.each([
    {
      recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      amount: 1n,
      expectedData:
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
    },
    {
      recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      amount: 0n,
      expectedData:
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000000",
    },
  ])("should return the correct buffer", ({ recipient, amount, expectedData }) => {
    const result = getErc20Data(recipient, amount);
    expect(result.toString("hex")).toEqual(expectedData);
  });

  it("should throw an error when recipient is empty", () => {
    expect(() => getErc20Data("", 1n)).toThrow("invalid address");
  });
});
