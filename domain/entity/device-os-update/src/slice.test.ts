import reducer, {
  clearOsUpdates,
  deviceOsUpdateInitialState,
  selectHasBackup,
  selectHasOsUpdates,
  selectOsUpdates,
  setHasBackup,
  setOsUpdates,
} from "./slice";
import { mockOsUpdate } from "./schema.mock";
import { mockDeviceOsUpdateRootState } from "./slice.mock";

describe("deviceOsUpdateSlice", () => {
  it("starts with no updates and no backup", () => {
    expect(reducer(undefined, { type: "init" })).toEqual(deviceOsUpdateInitialState);
  });

  it("stores the resolved updates", () => {
    const osUpdates = [mockOsUpdate()];
    expect(reducer(deviceOsUpdateInitialState, setOsUpdates(osUpdates)).osUpdates).toEqual(
      osUpdates,
    );
  });

  it("clears the updates and keeps the backup flag", () => {
    const state = { osUpdates: [mockOsUpdate()], hasBackup: true };
    expect(reducer(state, clearOsUpdates())).toEqual({ osUpdates: [], hasBackup: true });
  });

  it("stores the backup flag", () => {
    expect(reducer(deviceOsUpdateInitialState, setHasBackup(true)).hasBackup).toBe(true);
  });
});

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
