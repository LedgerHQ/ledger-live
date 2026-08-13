import { DeviceModelId, DeviceModelIdSchema } from "./schema";

describe("DeviceModelIdSchema", () => {
  it("accepts every declared device model ID", () => {
    expect(DeviceModelIdSchema.options).toEqual(Object.values(DeviceModelId));
  });

  it("rejects unknown device model IDs", () => {
    expect(DeviceModelIdSchema.safeParse("unknown").success).toBe(false);
  });
});
