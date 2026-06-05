import { renderHook } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import { setSelectedTimeRange } from "~/renderer/actions/settings";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useResetTimeRangeOnGraphRework } from "../useResetTimeRangeOnGraphRework";

// Mock only useWalletFeaturesConfig — testSetup renders the hook under the real Providers/store,
// so the rest of @features/platform-feature-flags must stay real.
jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useWalletFeaturesConfig: jest.fn(),
}));

const mockUseWalletFeaturesConfig = jest.mocked(useWalletFeaturesConfig);

function configWith(shouldDisplayGraphRework: boolean) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { shouldDisplayGraphRework } as ReturnType<typeof useWalletFeaturesConfig>;
}

describe("useResetTimeRangeOnGraphRework", () => {
  it("resets the selected time range to 'day' when the graph rework is enabled", () => {
    mockUseWalletFeaturesConfig.mockReturnValue(configWith(true));
    const store = createStore({ fetchRemoteFlags: null });
    store.dispatch(setSelectedTimeRange("week"));

    renderHook(() => useResetTimeRangeOnGraphRework(), { store });

    expect(selectedTimeRangeSelector(store.getState())).toBe("day");
  });

  it("leaves the selected time range unchanged when the graph rework is disabled", () => {
    mockUseWalletFeaturesConfig.mockReturnValue(configWith(false));
    const store = createStore({ fetchRemoteFlags: null });
    store.dispatch(setSelectedTimeRange("week"));

    renderHook(() => useResetTimeRangeOnGraphRework(), { store });

    expect(selectedTimeRangeSelector(store.getState())).toBe("week");
  });
});
