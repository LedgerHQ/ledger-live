import { describe, expect, it, spyOn } from "bun:test";
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";
import * as log from "../shared/log";
import { connectLedgerApp } from "./connect-ledger-app";

describe("connectLedgerApp", () => {
  it("resolves when the device action completes", async () => {
    const dmk = {
      _unsafeBypassIntentQueue: (): void => {},
      executeDeviceAction: () => ({
        observable: new Observable(observer => {
          observer.next({
            status: DeviceActionStatus.Completed,
            output: {},
          } as const);
          observer.complete();
        }),
        cancel: (): void => {},
      }),
    };

    await expect(connectLedgerApp(dmk as never, "sess-1", "evm")).resolves.toBeUndefined();
  });

  it("throws a proper Error when the device action ends with a tagged error object", async () => {
    const err = new UnknownDAError("test");
    const dmk = {
      _unsafeBypassIntentQueue: (): void => {},
      executeDeviceAction: () => ({
        observable: new Observable(observer => {
          observer.next({
            status: DeviceActionStatus.Error,
            error: err,
          } as const);
          observer.complete();
        }),
        cancel: () => {},
      }),
    };

    await expect(connectLedgerApp(dmk as never, "sess-1", "bitcoin")).rejects.toThrow(
      "UnknownDAError",
    );
  });

  it("debug-logs pending UnlockDevice once when that interaction is required", async () => {
    const spy = spyOn(log, "walletCliDebug").mockImplementation(() => {});
    const dmk = {
      _unsafeBypassIntentQueue: (): void => {},
      executeDeviceAction: () => ({
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
            status: DeviceActionStatus.Completed,
            output: {},
          } as const);
          observer.complete();
        }),
        cancel: () => {},
      }),
    };

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
});
