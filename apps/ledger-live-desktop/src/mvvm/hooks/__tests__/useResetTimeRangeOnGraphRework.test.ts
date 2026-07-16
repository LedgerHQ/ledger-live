import { renderHook } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import { setSelectedTimeRange } from "~/renderer/actions/settings";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { useResetTimeRangeOnGraphRework } from "../useResetTimeRangeOnGraphRework";

describe("useResetTimeRangeOnGraphRework", () => {
  it("resets the selected time range to 'day' when the graph rework is enabled", () => {
    const store = createStore({ fetchRemoteFlags: null });
    store.dispatch(setSelectedTimeRange("week"));

    renderHook(() => useResetTimeRangeOnGraphRework(), { store });

    expect(selectedTimeRangeSelector(store.getState())).toBe("day");
  });
});
