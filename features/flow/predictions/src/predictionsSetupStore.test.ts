import { act, renderHook } from "@testing-library/react";
import { usePredictionsSetupHooks } from "./predictionsSetupStore";
import {
  dismissPredictionsSetup,
  markPredictionsSetupPresented,
  MIN_SETUP_DISPLAY_MS,
  reportPredictionsSetup,
  startPredictionsSetup,
  usePredictionsSetup,
} from "./predictionsSetupStore.internals";

/** Starts a setup that comes on screen right away, as the sheet reports. */
function startShownSetup(): number {
  const setupId = startPredictionsSetup();
  markPredictionsSetupPresented();
  return setupId;
}

const settled = (promise: Promise<void>) => {
  let isSettled = false;
  void promise.then(() => {
    isSettled = true;
  });
  return () => isSettled;
};

describe("predictionsSetupStore", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => dismissPredictionsSetup());
    jest.useRealTimers();
  });

  it("opens loading, then shows the reported outcome once the loading has been on screen long enough", () => {
    const { result } = renderHook(() => usePredictionsSetup());

    let setupId = 0;
    act(() => {
      setupId = startShownSetup();
    });
    expect(result.current).toMatchObject({ isOpen: true, shownSetup: { outcome: null } });
    act(() => {
      void reportPredictionsSetup(setupId, { outcome: "created" });
    });
    act(() => jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS - 1));
    expect(result.current.shownSetup?.outcome).toBeNull();
    act(() => jest.advanceTimersByTime(1));

    expect(result.current.shownSetup?.outcome).toEqual({ outcome: "created" });
  });

  it("holds an outcome reported before the setup is on screen until it has been on screen long enough", () => {
    const { result } = renderHook(() => usePredictionsSetup());
    let setupId = 0;
    act(() => {
      setupId = startPredictionsSetup();
    });
    act(() => {
      void reportPredictionsSetup(setupId, { outcome: "created" });
      jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS);
    });
    expect(result.current.shownSetup?.outcome).toBeNull();

    act(() => markPredictionsSetupPresented());
    act(() => jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS - 1));
    expect(result.current.shownSetup?.outcome).toBeNull();
    act(() => jest.advanceTimersByTime(1));

    expect(result.current.shownSetup?.outcome).toEqual({ outcome: "created" });
  });

  it("shows only the first outcome reported", () => {
    const { result } = renderHook(() => usePredictionsSetup());
    let setupId = 0;
    act(() => {
      setupId = startShownSetup();
    });

    act(() => {
      void reportPredictionsSetup(setupId, { outcome: "found" });
      void reportPredictionsSetup(setupId, { outcome: "failed", reason: "unknown" });
      jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS);
    });

    expect(result.current.shownSetup?.outcome).toEqual({ outcome: "found" });
  });

  it("answers every report once the user closes the dialog, keeping its last state on screen", async () => {
    const { result } = renderHook(() => usePredictionsSetup());
    let setupId = 0;
    act(() => {
      setupId = startShownSetup();
    });
    const isFirstSettled = settled(reportPredictionsSetup(setupId, { outcome: "found" }));
    const isSecondSettled = settled(reportPredictionsSetup(setupId, { outcome: "found" }));
    act(() => jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS));
    await Promise.resolve();
    expect(isFirstSettled()).toBe(false);

    act(() => dismissPredictionsSetup());
    await Promise.resolve();

    expect(isFirstSettled()).toBe(true);
    expect(isSecondSettled()).toBe(true);
    expect(result.current).toMatchObject({
      isOpen: false,
      shownSetup: { outcome: { outcome: "found" } },
    });
  });

  it("lets whoever waits for a setup go on when a new one replaces it, and doesn't show its outcome in the new one", async () => {
    const { result } = renderHook(() => usePredictionsSetup());
    let replacedId = 0;
    act(() => {
      replacedId = startShownSetup();
    });
    const isReplacedSettled = settled(reportPredictionsSetup(replacedId, { outcome: "created" }));

    act(() => {
      startShownSetup();
    });
    await Promise.resolve();
    const isLateReportSettled = settled(reportPredictionsSetup(replacedId, { outcome: "found" }));
    act(() => jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS));
    await Promise.resolve();

    expect(isReplacedSettled()).toBe(true);
    expect(isLateReportSettled()).toBe(true);
    expect(result.current.shownSetup?.outcome).toBeNull();
  });
});

describe("usePredictionsSetupHooks", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => dismissPredictionsSetup());
    jest.useRealTimers();
  });

  it("reports to the setup the player started", () => {
    const setup = renderHook(() => usePredictionsSetup());
    const player = renderHook(() => usePredictionsSetupHooks());

    act(() => {
      player.result.current.startSetup();
      markPredictionsSetupPresented();
    });
    act(() => {
      void player.result.current["binding.reportSetup"]({ outcome: "found" });
      jest.advanceTimersByTime(MIN_SETUP_DISPLAY_MS);
    });

    expect(setup.result.current.shownSetup?.outcome).toEqual({ outcome: "found" });
  });

  it("answers a report right away when the player started no setup", async () => {
    const player = renderHook(() => usePredictionsSetupHooks());

    await expect(
      player.result.current["binding.reportSetup"]({ outcome: "created" }),
    ).resolves.toBeUndefined();
  });

  it("closes the setup it started when the player unmounts", () => {
    const setup = renderHook(() => usePredictionsSetup());
    const player = renderHook(() => usePredictionsSetupHooks());
    act(() => player.result.current.startSetup());

    act(() => player.unmount());

    expect(setup.result.current.isOpen).toBe(false);
  });

  it("leaves a setup another player started since when the player unmounts", () => {
    const setup = renderHook(() => usePredictionsSetup());
    const firstPlayer = renderHook(() => usePredictionsSetupHooks());
    const secondPlayer = renderHook(() => usePredictionsSetupHooks());
    act(() => firstPlayer.result.current.startSetup());
    act(() => secondPlayer.result.current.startSetup());

    act(() => firstPlayer.unmount());

    expect(setup.result.current.isOpen).toBe(true);
  });
});
