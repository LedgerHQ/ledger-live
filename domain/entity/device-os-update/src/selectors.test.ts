import { selectHasBackup, selectHasOsUpdates, selectOsUpdates } from "./selectors";
import { mockOsUpdate } from "./schema.mock";
import { mockDeviceOsUpdateRootState } from "./slice.mock";

describe("device OS update selectors", () => {
  it("reads the resolved updates", () => {
    const osUpdates = [mockOsUpdate()];
    const state = mockDeviceOsUpdateRootState({ osUpdates });
    expect(selectOsUpdates(state)).toEqual(osUpdates);
    expect(selectHasOsUpdates(state)).toBe(true);
  });

  it("reports no updates when none are resolved", () => {
    expect(selectHasOsUpdates(mockDeviceOsUpdateRootState())).toBe(false);
  });

  it("reads the backup flag", () => {
    expect(selectHasBackup(mockDeviceOsUpdateRootState({ hasBackup: true }))).toBe(true);
  });
});
