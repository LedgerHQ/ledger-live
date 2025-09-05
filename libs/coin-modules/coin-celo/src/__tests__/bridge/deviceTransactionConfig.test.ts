import getDeviceTransactionConfig from "../../bridge/deviceTransactionConfig";

describe("deviceTransactionConfig", () => {
  it("returns the expected config", () => {
    expect(getDeviceTransactionConfig()).toEqual([
      {
        type: "amount",
        label: "Amount",
      },
      {
        type: "fees",
        label: "Fees",
      },
    ]);
  });
});
