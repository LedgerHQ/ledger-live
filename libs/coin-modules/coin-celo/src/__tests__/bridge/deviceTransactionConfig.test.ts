import getDeviceTransactionConfig from "../../bridge/deviceTransactionConfig";

describe("deviceTransactionConfig", () => {
  it("returns the expected config", async () => {
    const result = await getDeviceTransactionConfig();
    expect(result).toEqual([
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
