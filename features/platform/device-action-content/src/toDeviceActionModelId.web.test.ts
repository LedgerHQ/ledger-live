import { supportedDeviceActionModelIds, toDeviceActionModelId } from "./toDeviceActionModelId";

describe("toDeviceActionModelId", () => {
  it.each(supportedDeviceActionModelIds)("narrows %s to itself", modelId => {
    expect(toDeviceActionModelId(modelId)).toBe(modelId);
  });

  it("returns null for blue", () => {
    expect(toDeviceActionModelId("blue")).toBeNull();
  });

  it("returns null for an unknown model id", () => {
    expect(toDeviceActionModelId("some-future-device")).toBeNull();
  });
});
