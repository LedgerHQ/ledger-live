import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";
import { connectLedgerApp } from "./connect-ledger-app";
import type { DeviceState } from "./device-state";
import { WalletCliDeviceError } from "./wallet-cli-device-error";

function makeDmk(
  executeDeviceAction: () => { observable: Observable<unknown>; cancel: () => void },
) {
  return {
    _unsafeBypassIntentQueue: (): void => {},
    executeDeviceAction,
  };
}

function completedAction() {
  return {
    observable: new Observable(observer => {
      observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
      observer.complete();
    }),
    cancel: (): void => {},
  };
}

function errorAction(error: unknown) {
  return {
    observable: new Observable(observer => {
      observer.next({ status: DeviceActionStatus.Error, error } as const);
      observer.complete();
    }),
    cancel: (): void => {},
  };
}

function installControlledTimers() {
  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const scheduled: Array<{
    id: number;
    ms: number | undefined;
    cleared: boolean;
    run: () => void;
  }> = [];

  globalThis.setTimeout = ((
    handler: (...args: unknown[]) => void,
    ms?: number,
    ...args: unknown[]
  ) => {
    const timer = {
      id: scheduled.length + 1,
      ms,
      cleared: false,
      run: () => handler(...args),
    };
    scheduled.push(timer);
    return timer.id as unknown as ReturnType<typeof globalThis.setTimeout>;
  }) as typeof globalThis.setTimeout;

  globalThis.clearTimeout = ((id?: ReturnType<typeof globalThis.setTimeout>) => {
    const timer = scheduled.find(t => t.id === (id as unknown as number));
    if (timer) timer.cleared = true;
  }) as typeof globalThis.clearTimeout;

  return {
    scheduled,
    waitRealTick: () => new Promise(resolve => realSetTimeout(resolve, 0)),
    restore: () => {
      globalThis.setTimeout = realSetTimeout;
      globalThis.clearTimeout = realClearTimeout;
    },
  };
}

describe("connectLedgerApp", () => {
  it("resolves when the device action completes", async () => {
    const dmk = makeDmk(() => completedAction());
    await expect(connectLedgerApp(dmk as never, "sess-1", "evm")).resolves.toBeUndefined();
  });

  it("throws a WalletCliDeviceError when the device action ends with a tagged DMK error", async () => {
    const err = new UnknownDAError("test");
    const dmk = makeDmk(() => errorAction(err));

    try {
      await connectLedgerApp(dmk as never, "sess-1", "bitcoin");
      throw new Error("expected connectLedgerApp to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(WalletCliDeviceError);
      const state = (e as WalletCliDeviceError).state;
      expect(state.code).toBe("unknown");
    }
  });

  it("throws disconnected when the device action completes without any emission", async () => {
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.complete();
      }),
      cancel: (): void => {},
    }));

    try {
      await connectLedgerApp(dmk as never, "sess-1", "bitcoin");
      throw new Error("expected connectLedgerApp to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(WalletCliDeviceError);
      expect((e as WalletCliDeviceError).state).toEqual({ code: "disconnected" });
    }
  });

  it("throws unknown when the device action observable errors with an arbitrary Error", async () => {
    const error = new Error("unexpected connect failure");
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.error(error);
      }),
      cancel: (): void => {},
    }));

    try {
      await connectLedgerApp(dmk as never, "sess-1", "bitcoin");
      throw new Error("expected connectLedgerApp to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(WalletCliDeviceError);
      expect((e as WalletCliDeviceError).state).toEqual({ code: "unknown", cause: error });
    }
  });

  it("emits awaiting_approval.unlock when UnlockDevice interaction is required", async () => {
    const states: DeviceState[] = [];
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.UnlockDevice,
          },
        });
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.UnlockDevice,
          },
        });
        observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
        observer.complete();
      }),
      cancel: () => {},
    }));

    await connectLedgerApp(dmk as never, "sess-1", "evm", {
      onStateChange: s => states.push(s),
    });

    const unlockStates = states.filter(
      s => s.code === "awaiting_approval" && s.reason === "unlock",
    );
    expect(unlockStates).toHaveLength(1);
  });

  it("does not emit state for pending None or missing interactions", async () => {
    const states: DeviceState[] = [];
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.None,
          },
        });
        observer.next({
          status: DeviceActionStatus.Pending,
        });
        observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
        observer.complete();
      }),
      cancel: () => {},
    }));

    await connectLedgerApp(dmk as never, "sess-1", "evm", {
      onStateChange: s => states.push(s),
    });

    expect(states).toEqual([]);
  });

  it("emits awaiting_approval.open_app when ConfirmOpenApp interaction is required", async () => {
    const states: DeviceState[] = [];
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.ConfirmOpenApp,
          },
        });
        observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
        observer.complete();
      }),
      cancel: () => {},
    }));

    await connectLedgerApp(dmk as never, "sess-1", "evm", {
      onStateChange: s => states.push(s),
    });

    expect(states.some(s => s.code === "awaiting_approval" && s.reason === "open_app")).toBe(true);
  });

  it("emits unlock then open-app states while deduping consecutive duplicates", async () => {
    const states: DeviceState[] = [];
    const dmk = makeDmk(() => ({
      observable: new Observable(observer => {
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.UnlockDevice,
          },
        });
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.UnlockDevice,
          },
        });
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.ConfirmOpenApp,
          },
        });
        observer.next({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.ConfirmOpenApp,
          },
        });
        observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
        observer.complete();
      }),
      cancel: () => {},
    }));

    await connectLedgerApp(dmk as never, "sess-1", "evm", {
      onStateChange: s => states.push(s),
    });

    expect(states).toEqual([
      { code: "awaiting_approval", reason: "unlock" },
      { code: "awaiting_approval", reason: "open_app" },
    ]);
  });

  describe("silence timeout", () => {
    it("cancels and rejects with timeout when no progress occurs", async () => {
      const timers = installControlledTimers();
      try {
        let cancelCalls = 0;
        const dmk = makeDmk(() => ({
          observable: new Observable(() => undefined),
          cancel: () => {
            cancelCalls++;
          },
        }));

        const promise = connectLedgerApp(dmk as never, "sess-1", "evm", {
          deviceTimeoutMs: 1,
        });
        expect(timers.scheduled).toHaveLength(1);

        timers.scheduled[0].run();
        const result = await Promise.race([
          promise.then(
            () => "resolved",
            e => e,
          ),
          timers.waitRealTick().then(() => "pending"),
        ]);

        expect(result).toBeInstanceOf(WalletCliDeviceError);
        expect((result as WalletCliDeviceError).state).toEqual({ code: "timeout" });
        expect(cancelCalls).toBe(1);
        expect(timers.scheduled[0].cleared).toBe(true);
      } finally {
        timers.restore();
      }
    });

    it("clears the silence timeout when the action completes", async () => {
      const timers = installControlledTimers();
      try {
        const dmk = makeDmk(() => completedAction());

        await connectLedgerApp(dmk as never, "sess-1", "evm", {
          deviceTimeoutMs: 1,
        });

        expect(timers.scheduled).toHaveLength(1);
        expect(timers.scheduled[0].cleared).toBe(true);
      } finally {
        timers.restore();
      }
    });

    it("clears the silence timeout when the action errors", async () => {
      const timers = installControlledTimers();
      try {
        const error = new Error("boom");
        const dmk = makeDmk(() => ({
          observable: new Observable(observer => {
            observer.error(error);
          }),
          cancel: (): void => {},
        }));

        await expect(
          connectLedgerApp(dmk as never, "sess-1", "evm", {
            deviceTimeoutMs: 1,
          }),
        ).rejects.toBeInstanceOf(WalletCliDeviceError);

        expect(timers.scheduled).toHaveLength(1);
        expect(timers.scheduled[0].cleared).toBe(true);
      } finally {
        timers.restore();
      }
    });
  });

  describe("transport framing error retries", () => {
    const realSetTimeout = globalThis.setTimeout;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globalThis.setTimeout = ((fn: () => void, _ms?: number) => realSetTimeout(fn, 0)) as any;
    });

    afterEach(() => {
      globalThis.setTimeout = realSetTimeout;
    });

    it("retries on ReceiverApduError and succeeds on the next attempt", async () => {
      let calls = 0;
      const dmk = makeDmk(() => {
        calls++;
        return calls === 1
          ? errorAction({ _tag: "ReceiverApduError" as const })
          : completedAction();
      });

      await expect(connectLedgerApp(dmk as never, "sess-1", "ethereum")).resolves.toBeUndefined();
      expect(calls).toBe(2);
    });

    it("retries on UnknownDeviceExchangeError and succeeds on the next attempt", async () => {
      let calls = 0;
      const dmk = makeDmk(() => {
        calls++;
        return calls === 1
          ? errorAction({ _tag: "UnknownDeviceExchangeError" as const })
          : completedAction();
      });

      await expect(connectLedgerApp(dmk as never, "sess-1", "ethereum")).resolves.toBeUndefined();
      expect(calls).toBe(2);
    });

    it("does not retry non-retriable tagged errors", async () => {
      let calls = 0;
      const dmk = makeDmk(() => {
        calls++;
        return errorAction({ _tag: "RefusedByUserDAError" as const });
      });

      try {
        await connectLedgerApp(dmk as never, "sess-1", "ethereum");
        throw new Error("expected to throw");
      } catch (e) {
        expect(e).toBeInstanceOf(WalletCliDeviceError);
        expect((e as WalletCliDeviceError).state).toEqual({
          code: "rejected",
          context: "open_app",
        });
      }
      expect(calls).toBe(1);
    });

    it("throws a WalletCliDeviceError (timeout) after exhausting retries on ReceiverApduError", async () => {
      let calls = 0;
      const dmk = makeDmk(() => {
        calls++;
        return errorAction({ _tag: "ReceiverApduError" as const });
      });

      try {
        await connectLedgerApp(dmk as never, "sess-1", "ethereum");
        throw new Error("expected to throw");
      } catch (e) {
        expect(e).toBeInstanceOf(WalletCliDeviceError);
        expect((e as WalletCliDeviceError).state.code).toBe("timeout");
      }
      expect(calls).toBe(6);
    });
  });
});
