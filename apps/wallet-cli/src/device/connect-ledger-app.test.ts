import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";
import * as log from "../shared/log";
import { connectLedgerApp } from "./connect-ledger-app";

function makeDmk(executeDeviceAction: () => { observable: Observable<unknown>; cancel: () => void }) {
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

  it("throws a proper Error when the device action ends with a tagged error object", async () => {
    const err = new UnknownDAError("test");
    const dmk = makeDmk(() => errorAction(err));

    await expect(connectLedgerApp(dmk as never, "sess-1", "bitcoin")).rejects.toThrow(
      "UnknownDAError",
    );
  });

  it("debug-logs pending UnlockDevice once when that interaction is required", async () => {
    const spy = spyOn(log, "walletCliDebug").mockImplementation(() => {});
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

    await connectLedgerApp(dmk as never, "sess-1", "evm");

    const pendingUnlock = spy.mock.calls.filter(
      args =>
        typeof args[0] === "string" &&
        args[0].includes("ConnectApp pending") &&
        args[1] === UserInteractionRequired.UnlockDevice,
    );
    expect(pendingUnlock).toHaveLength(1);
    spy.mockRestore();
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

    it("throws a user-friendly error after exhausting retries on ReceiverApduError", async () => {
      let calls = 0;
      const dmk = makeDmk(() => {
        calls++;
        return errorAction({ _tag: "ReceiverApduError" as const });
      });

      await expect(connectLedgerApp(dmk as never, "sess-1", "ethereum")).rejects.toThrow(
        /could not communicate/i,
      );
      expect(calls).toBe(6); // 1 initial + 5 retries
    });
  });
});
