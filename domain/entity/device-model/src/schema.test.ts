import { DeviceModelIdSchema } from "./schema";

describe("DeviceModelIdSchema", () => {
  it("accepts every supported Ledger device model", () => {
    expect(DeviceModelIdSchema.options).toEqual([
      "blue",
      "nanoS",
      "nanoSP",
      "nanoX",
      "stax",
      "europa",
      "apex",
    ]);
  });
});
