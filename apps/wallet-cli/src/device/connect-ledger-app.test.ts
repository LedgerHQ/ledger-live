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
