import { useAccountDetailToolProps } from "@devtools/bindings";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import { ConfigureDBSaveEffects } from "~/components/DBSave";
import type { State } from "~/reducers/types";

const STORAGE_KEY = "accountAnalyticsIntroduction";

const withIntroduction =
  (hasDismissed: boolean) =>
  (state: State): State => ({ ...state, accountAnalyticsIntroduction: { hasDismissed } });

describe("account-detail DevTools tool on mobile", () => {
  beforeEach(async () => {
    await storage.delete(STORAGE_KEY);
  });

  it("reports an Analytics card that was never dismissed", () => {
    const { result } = renderHook(() => useAccountDetailToolProps(), {
      overrideInitialState: withIntroduction(false),
    });

    expect(result.current.analyticsIntroduction.hasDismissed).toBe(false);
  });

  it("makes a dismissed Analytics card available again", () => {
    const { result, store } = renderHook(() => useAccountDetailToolProps(), {
      overrideInitialState: withIntroduction(true),
    });
    expect(result.current.analyticsIntroduction.hasDismissed).toBe(true);

    act(() => result.current.analyticsIntroduction.onReset());

    expect(result.current.analyticsIntroduction.hasDismissed).toBe(false);
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });

  it("persists the reset locally so the card still shows after a restart", async () => {
    const { result } = renderHook(
      () => {
        ConfigureDBSaveEffects();
        return useAccountDetailToolProps();
      },
      { overrideInitialState: withIntroduction(true) },
    );

    act(() => result.current.analyticsIntroduction.onReset());

    await waitFor(async () =>
      expect(await storage.get(STORAGE_KEY)).toEqual({ hasDismissed: false }),
    );
  });
});
