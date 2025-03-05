import getDeviceTransactionConfig, { methodToString } from "../../bridge/deviceTransactionConfig";

describe("deviceTransactionConfig", () => {
  test("methodToString", () => {
    expect(methodToString(0)).toBe("Coin transfer");
    expect(methodToString(1)).toBe("Unknown");
  });

  test("getDeviceTransactionConfig", () => {
    const fields = getDeviceTransactionConfig();
    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Type",
        value: "Coin transfer",
      },
    ]);
  });
});
