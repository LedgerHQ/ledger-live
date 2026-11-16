import reducer, {
  clearOsUpdates,
  deviceOsUpdateInitialState,
  setHasBackup,
  setOsUpdates,
} from "./slice";
import { mockOsUpdate } from "./schema.mock";

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
