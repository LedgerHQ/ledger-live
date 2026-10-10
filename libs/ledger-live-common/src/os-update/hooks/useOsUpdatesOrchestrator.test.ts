/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions, unicorn/consistent-function-scoping
import { act, renderHook } from "@testing-library/react";
import {
  ApplyUpdatesStateType,
  OsUpdatesOrchestratorUseCase,
  OsUpdatesSteps,
  PreChecksStateType,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { PROGRESS_THROTTLE_MS, useOsUpdatesOrchestrator } from "./useOsUpdatesOrchestrator";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-shared"),
  OsUpdatesOrchestratorUseCase: jest.fn(),
}));

const loadingProgress: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.LOADING },
};

type FakeOrchestrator = {
  start: jest.Mock;
  stop: jest.Mock;
  unsubscribe: jest.Mock;
  emit: (progress: OsUpdatesProgress) => void;
  input: OsUpdatesOrchestratorUseCaseInput;
};

describe("useOsUpdatesOrchestrator", () => {
  let created: FakeOrchestrator[];

  beforeEach(() => {
    created = [];
    jest.mocked(OsUpdatesOrchestratorUseCase).mockImplementation(
      () =>
        ({
          execute: (input: OsUpdatesOrchestratorUseCaseInput) => {
            let listener: (progress: OsUpdatesProgress) => void = () => undefined;
            const unsubscribe = jest.fn();
            const fake: FakeOrchestrator = {
              start: jest.fn(),
              stop: jest.fn(() => input.onStop()),
              unsubscribe,
              emit: progress => listener(progress),
              input,
            };
            created.push(fake);
            return {
              start: fake.start,
              stop: fake.stop,
              subscribe: (next: (progress: OsUpdatesProgress) => void) => {
                listener = next;
                return { unsubscribe };
              },
            };
          },
        }) as unknown as OsUpdatesOrchestratorUseCase,
    );
  });

  const makeInput = (
    overrides: Partial<OsUpdatesOrchestratorUseCaseInput> = {},
  ): OsUpdatesOrchestratorUseCaseInput => ({
    dmk: {} as OsUpdatesOrchestratorUseCaseInput["dmk"],
    connectedDevice: {} as OsUpdatesOrchestratorUseCaseInput["connectedDevice"],
    osUpdates: [],
    storage: {} as OsUpdatesOrchestratorUseCaseInput["storage"],
    onStop: jest.fn(),
    ...overrides,
  });

  it("starts the orchestrator once and returns null until the first snapshot", () => {
    const input = makeInput();
    const { result } = renderHook(() => useOsUpdatesOrchestrator(input));

    expect(created).toHaveLength(1);
    expect(created[0].start).toHaveBeenCalledTimes(1);
    expect(result.current.osUpdatesProgress).toBeNull();
  });

  it("publishes the progress snapshots", () => {
    const input = makeInput();
    const { result } = renderHook(() => useOsUpdatesOrchestrator(input));

    act(() => created[0].emit(loadingProgress));

    expect(result.current.osUpdatesProgress).toEqual(loadingProgress);
  });

  it("unsubscribes and stops on unmount without calling onStop", () => {
    const onStop = jest.fn();
    const input = makeInput({ onStop });
    const { unmount } = renderHook(() => useOsUpdatesOrchestrator(input));

    unmount();

    expect(created[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(created[0].stop).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it("calls the latest onStop when the orchestrator stops by itself", () => {
    const firstOnStop = jest.fn();
    const latestOnStop = jest.fn();
    const base = makeInput();
    const { rerender } = renderHook(({ onStop }) => useOsUpdatesOrchestrator({ ...base, onStop }), {
      initialProps: { onStop: firstOnStop },
    });

    rerender({ onStop: latestOnStop });
    created[0].input.onStop();

    expect(firstOnStop).not.toHaveBeenCalled();
    expect(latestOnStop).toHaveBeenCalledTimes(1);
  });

  it("does not restart when re-rendered with new callback and input object identities", () => {
    const base = makeInput();
    const { rerender } = renderHook(
      ({ onStop }: { onStop: () => void }) =>
        useOsUpdatesOrchestrator({ ...base, onStop, unlockTimeout: 1 }),
      { initialProps: { onStop: () => undefined } },
    );

    rerender({ onStop: () => undefined });
    rerender({ onStop: () => undefined });

    expect(created).toHaveLength(1);
    expect(created[0].stop).not.toHaveBeenCalled();
  });

  it("restarts with a fresh orchestrator when the osUpdates change", () => {
    const base = makeInput();
    const { result, rerender } = renderHook(
      ({ osUpdates }) => useOsUpdatesOrchestrator({ ...base, osUpdates }),
      { initialProps: { osUpdates: base.osUpdates } },
    );

    rerender({ osUpdates: [] });
    act(() => created[1].emit(loadingProgress));

    expect(created).toHaveLength(2);
    expect(created[0].stop).toHaveBeenCalledTimes(1);
    expect(created[1].start).toHaveBeenCalledTimes(1);
    expect(result.current.osUpdatesProgress).toEqual(loadingProgress);
  });

  it("restarts when the connected device changes", () => {
    const base = makeInput();
    const { rerender } = renderHook(
      ({ connectedDevice }) => useOsUpdatesOrchestrator({ ...base, connectedDevice }),
      { initialProps: { connectedDevice: base.connectedDevice } },
    );

    rerender({ connectedDevice: {} as OsUpdatesOrchestratorUseCaseInput["connectedDevice"] });

    expect(created).toHaveLength(2);
  });

  describe("progress throttling", () => {
    const updating = (progress: number): OsUpdatesProgress => ({
      step: OsUpdatesSteps.APPLY_UPDATES,
      state: { type: ApplyUpdatesStateType.UPDATING, progress, updateIndex: 1, updateCount: 1 },
    });
    const progressOf = (value: OsUpdatesProgress | null) =>
      value?.state && "progress" in value.state ? value.state.progress : undefined;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("renders the first progress tick immediately", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));

      act(() => created[0].emit(updating(0.1)));

      expect(progressOf(result.current.osUpdatesProgress)).toBe(0.1);
    });

    it("coalesces the ticks of an interval and renders the latest one when it elapses", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));
      act(() => created[0].emit(updating(0.1)));

      act(() => {
        created[0].emit(updating(0.2));
        created[0].emit(updating(0.3));
        created[0].emit(updating(0.4));
      });

      expect(progressOf(result.current.osUpdatesProgress)).toBe(0.1);

      act(() => {
        jest.advanceTimersByTime(PROGRESS_THROTTLE_MS);
      });

      expect(progressOf(result.current.osUpdatesProgress)).toBe(0.4);
    });

    it("renders a tick at once when the interval has already elapsed", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));
      act(() => created[0].emit(updating(0.1)));

      act(() => {
        jest.advanceTimersByTime(PROGRESS_THROTTLE_MS);
        created[0].emit(updating(0.5));
      });

      expect(progressOf(result.current.osUpdatesProgress)).toBe(0.5);
    });

    it("never holds back a change of state, and drops the tick it was waiting to render", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));
      act(() => created[0].emit(updating(0.1)));
      act(() => created[0].emit(updating(0.2)));
      const applied: OsUpdatesProgress = {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
      };

      act(() => created[0].emit(applied));
      act(() => {
        jest.advanceTimersByTime(PROGRESS_THROTTLE_MS * 2);
      });

      expect(result.current.osUpdatesProgress).toEqual(applied);
    });

    it("does not hold back a prompt that follows a progress tick", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));
      act(() => created[0].emit(updating(0.1)));
      const locked: OsUpdatesProgress = {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.DEVICE_LOCKED },
      };

      act(() => created[0].emit(locked));

      expect(result.current.osUpdatesProgress).toEqual(locked);
    });

    it("never throttles states that carry no progress", () => {
      const input = makeInput();
      const { result } = renderHook(() => useOsUpdatesOrchestrator(input));
      const second: OsUpdatesProgress = { ...loadingProgress };

      act(() => created[0].emit(loadingProgress));
      act(() => created[0].emit(second));

      expect(result.current.osUpdatesProgress).toBe(second);
    });

    it("cancels the pending tick on unmount", () => {
      const input = makeInput();
      const { unmount } = renderHook(() => useOsUpdatesOrchestrator(input));
      act(() => created[0].emit(updating(0.1)));
      act(() => created[0].emit(updating(0.2)));

      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
