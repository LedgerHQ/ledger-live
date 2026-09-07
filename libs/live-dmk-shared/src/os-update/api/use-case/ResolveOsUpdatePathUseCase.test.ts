import {
  DeviceActionStatus,
  UnknownDAError,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import type { OsUpdate, ResolveOsUpdatePathDAState } from "@ledgerhq/dmk-ledger-wallet";
import { of, Subject } from "rxjs";
import { ResolveOsUpdatePathUseCase } from "./ResolveOsUpdatePathUseCase";

const SESSION_ID = "session-id";
const AN_OS_UPDATE = {} as OsUpdate;

describe("ResolveOsUpdatePathUseCase", () => {
  let cancel: jest.Mock;
  let dmk: DeviceManagementKit;
  let states: Subject<ResolveOsUpdatePathDAState>;

  const execute = (overrides: { unlockTimeout?: number } = {}) =>
    new ResolveOsUpdatePathUseCase().execute({
      dmk,
      sessionId: SESSION_ID,
      ...overrides,
    });

  beforeEach(() => {
    cancel = jest.fn();
    states = new Subject<ResolveOsUpdatePathDAState>();
    dmk = {
      executeDeviceAction: jest.fn(() => ({
        observable: states.asObservable(),
        cancel,
      })),
    } as unknown as DeviceManagementKit;
  });

  describe("success", () => {
    it("should return OS updates when the device action completes", async () => {
      const promise = execute();
      states.next({
        status: DeviceActionStatus.NotStarted,
      } as ResolveOsUpdatePathDAState);
      states.next({
        status: DeviceActionStatus.Pending,
        intermediateValue: {
          step: "getOsVersion",
          requiredUserInteraction: "none",
        },
      } as ResolveOsUpdatePathDAState);
      states.next({
        status: DeviceActionStatus.Completed,
        output: [AN_OS_UPDATE],
      });

      await expect(promise).resolves.toEqual([AN_OS_UPDATE]);
      expect(dmk.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: SESSION_ID }),
      );
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should keep the first result when a later terminal snapshot arrives", async () => {
      const promise = execute();
      states.next({
        status: DeviceActionStatus.Completed,
        output: [AN_OS_UPDATE],
      });
      states.next({
        status: DeviceActionStatus.Error,
        error: new UnknownDAError("late error"),
      } as unknown as ResolveOsUpdatePathDAState);

      await expect(promise).resolves.toEqual([AN_OS_UPDATE]);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should resolve when the device action completes synchronously on subscribe", async () => {
      dmk = {
        executeDeviceAction: jest.fn(() => ({
          observable: of({
            status: DeviceActionStatus.Completed,
            output: [AN_OS_UPDATE],
          } as ResolveOsUpdatePathDAState),
          cancel,
        })),
      } as unknown as DeviceManagementKit;

      await expect(execute()).resolves.toEqual([AN_OS_UPDATE]);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should pass the given unlock timeout to the device action", () => {
      void execute({ unlockTimeout: 5_000 });

      const [{ deviceAction }] = (dmk.executeDeviceAction as jest.Mock).mock.calls[0];
      expect(deviceAction.input.unlockTimeout).toBe(5_000);
    });
  });

  describe("error", () => {
    it("should reject when the device action reports an error status", async () => {
      const error = new UnknownDAError("resolve failed");
      const promise = execute();
      states.next({
        status: DeviceActionStatus.Error,
        error,
      } as unknown as ResolveOsUpdatePathDAState);

      await expect(promise).rejects.toBe(error);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should reject when the device action is stopped", async () => {
      const promise = execute();
      states.next({
        status: DeviceActionStatus.Stopped,
      } as ResolveOsUpdatePathDAState);

      await expect(promise).rejects.toThrow("Resolve OS update path stopped");
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should reject when the device action observable errors", async () => {
      const error = new Error("observable failed");
      const promise = execute();
      states.error(error);

      await expect(promise).rejects.toBe(error);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("should reject when the observable completes without a terminal snapshot", async () => {
      const promise = execute();
      states.next({
        status: DeviceActionStatus.Pending,
        intermediateValue: {
          step: "getOsVersion",
          requiredUserInteraction: "none",
        },
      } as ResolveOsUpdatePathDAState);
      states.complete();

      await expect(promise).rejects.toThrow(
        "Resolve OS update path completed without a terminal snapshot",
      );
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });
});
