import { system } from "~/renderer/bridge";
import { getResourceUsage, setVisualZoomLevelLimits } from "./webFrame";

describe("webFrame", () => {
  it("should set the zoom limits through the bridge", () => {
    setVisualZoomLevelLimits(1, 1);

    expect(system.setVisualZoomLevelLimits).toHaveBeenCalledWith(1, 1);
  });

  it("should read the resource usage through the bridge", () => {
    const usage = { images: { count: 1 } } as unknown as Electron.ResourceUsage;
    jest.mocked(system.getResourceUsage).mockReturnValue(usage);

    expect(getResourceUsage()).toBe(usage);
  });
});
