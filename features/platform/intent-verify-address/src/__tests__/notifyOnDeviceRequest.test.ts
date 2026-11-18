import {
  GetAppAndVersionCommand,
  GetOsVersionCommand,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { Observable, type Subscriber } from "rxjs";
import { notifyOnDeviceRequest } from "../notifyOnDeviceRequest";

class FakeDmk {
  readonly sessionId = "session-1";
  readonly sendApdu = jest.fn(async () => ({
    data: new Uint8Array(),
    statusCode: new Uint8Array(),
  }));
  readonly sendCommand = jest.fn(async () => ({ status: "SUCCESS" }));
  readonly executeDeviceAction = jest.fn((): unknown => ({ observable: "device-action" }));

  getConnectedDevice() {
    return { sessionId: this.sessionId };
  }
}

const APP_AND_VERSION_APDU = new Uint8Array([0xb0, 0x01, 0x00, 0x00, 0x00]);
const GET_ADDRESS_APDU = new Uint8Array([0xe0, 0x02, 0x01, 0x00, 0x00]);

function setup(signal?: AbortSignal) {
  const fakeDmk = new FakeDmk();
  const onDeviceRequest = jest.fn();
  const dmk = notifyOnDeviceRequest(
    fakeDmk as unknown as DeviceManagementKit,
    onDeviceRequest,
    signal,
  );

  return { fakeDmk, dmk, onDeviceRequest };
}

type DeviceAction = { observable: Observable<string>; cancel: () => void };

function startDeviceAction(signal?: AbortSignal) {
  const { fakeDmk, dmk } = setup(signal);
  let device: Subscriber<string> | undefined;
  let subscriptionCount = 0;
  const deviceAction = {
    observable: new Observable<string>(subscriber => {
      subscriptionCount += 1;
      device = subscriber;
    }),
    cancel: jest.fn(),
  };
  fakeDmk.executeDeviceAction.mockReturnValueOnce(deviceAction);

  const executeDeviceAction = dmk.executeDeviceAction as (args: unknown) => unknown;
  const action = executeDeviceAction({ sessionId: "session-1" }) as DeviceAction;
  const states: string[] = [];
  const error = jest.fn();
  action.observable.subscribe({ next: state => states.push(state), error });

  return {
    action,
    deviceAction,
    device: () => device!,
    error,
    states,
    subscriptionCount: () => subscriptionCount,
  };
}

describe("notifyOnDeviceRequest", () => {
  it("notifies when an APDU is sent, then forwards it to the device", async () => {
    const { dmk, fakeDmk, onDeviceRequest } = setup();
    const args = { sessionId: "session-1", apdu: new Uint8Array([0xe0]) };

    await expect(dmk.sendApdu(args)).resolves.toEqual({
      data: new Uint8Array(),
      statusCode: new Uint8Array(),
    });
    expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    expect(fakeDmk.sendApdu).toHaveBeenCalledWith(args);
  });

  it.each(["sendCommand", "executeDeviceAction"] as const)(
    "notifies when a DMK signer calls %s",
    method => {
      const { dmk, fakeDmk, onDeviceRequest } = setup();

      (dmk[method] as (args: unknown) => unknown)({ sessionId: "session-1" });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
      expect(fakeDmk[method]).toHaveBeenCalledWith({ sessionId: "session-1" });
    },
  );

  it("forwards other calls without notifying, keeping the original dmk as this", () => {
    const { dmk, onDeviceRequest } = setup();

    expect(dmk.getConnectedDevice({ sessionId: "session-1" })).toEqual({ sessionId: "session-1" });
    expect(onDeviceRequest).not.toHaveBeenCalled();
  });

  describe("the app-and-version query", () => {
    it("does not notify for the BOLOS app-and-version APDU, which is still sent to the device", async () => {
      const { dmk, fakeDmk, onDeviceRequest } = setup();
      const args = { sessionId: "session-1", apdu: APP_AND_VERSION_APDU };

      await dmk.sendApdu(args);

      expect(onDeviceRequest).not.toHaveBeenCalled();
      expect(fakeDmk.sendApdu).toHaveBeenCalledWith(args);
    });

    it("notifies for an APDU of the BOLOS class that is not the app-and-version instruction", async () => {
      const { dmk, onDeviceRequest } = setup();

      await dmk.sendApdu({ sessionId: "session-1", apdu: new Uint8Array([0xb0, 0x02]) });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    });

    it("does not notify for the DMK app-and-version command", () => {
      const { dmk, onDeviceRequest } = setup();

      dmk.sendCommand({ sessionId: "session-1", command: new GetAppAndVersionCommand() });

      expect(onDeviceRequest).not.toHaveBeenCalled();
    });

    it("notifies for any other DMK command", () => {
      const { dmk, onDeviceRequest } = setup();

      dmk.sendCommand({ sessionId: "session-1", command: new GetOsVersionCommand() });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    });

    it("notifies when the command cannot say which APDU it sends", () => {
      const { dmk, onDeviceRequest } = setup();
      const command = {
        getApdu: () => {
          throw new Error("missing args");
        },
      };

      (dmk.sendCommand as (args: unknown) => unknown)({ sessionId: "session-1", command });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    });

    it("still notifies for a device action, which has no app-and-version form to skip", () => {
      const { dmk, onDeviceRequest } = setup();

      (dmk.executeDeviceAction as (args: unknown) => unknown)({ sessionId: "session-1" });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe("once the signal is aborted", () => {
    it.each(["sendApdu", "sendCommand"] as const)(
      "rejects a later %s, even for the app-and-version query",
      async method => {
        const controller = new AbortController();
        const { dmk, fakeDmk } = setup(controller.signal);
        controller.abort();

        await expect(
          (dmk[method] as (args: unknown) => Promise<unknown>)({
            sessionId: "session-1",
            apdu: APP_AND_VERSION_APDU,
            command: new GetAppAndVersionCommand(),
          }),
        ).rejects.toMatchObject({ name: "DeviceRequestAbortedError" });
        expect(fakeDmk[method]).not.toHaveBeenCalled();
      },
    );

    it("throws on a later device action without starting it", () => {
      const controller = new AbortController();
      const { dmk, fakeDmk } = setup(controller.signal);
      controller.abort();

      expect(() =>
        (dmk.executeDeviceAction as (args: unknown) => unknown)({ sessionId: "session-1" }),
      ).toThrow("cancelled");
      expect(fakeDmk.executeDeviceAction).not.toHaveBeenCalled();
    });

    it("keeps forwarding the calls that are not device requests", () => {
      const controller = new AbortController();
      const { dmk } = setup(controller.signal);
      controller.abort();

      expect(dmk.getConnectedDevice({ sessionId: "session-1" })).toEqual({
        sessionId: "session-1",
      });
    });
  });

  describe("a device action started with a signal", () => {
    it("cancels the action when the signal aborts while it runs", () => {
      const controller = new AbortController();
      const { deviceAction } = startDeviceAction(controller.signal);

      controller.abort();

      expect(deviceAction.cancel).toHaveBeenCalledTimes(1);
    });

    it.each(["abort then cancel", "cancel then abort"])("cancels the action once on %s", order => {
      const controller = new AbortController();
      const { action, deviceAction } = startDeviceAction(controller.signal);
      const steps = [() => controller.abort(), () => action.cancel()];

      for (const step of order === "abort then cancel" ? steps : steps.reverse()) step();

      expect(deviceAction.cancel).toHaveBeenCalledTimes(1);
    });

    it("emits what the action emits, from a single subscription to it", () => {
      const controller = new AbortController();
      const { device, states, subscriptionCount } = startDeviceAction(controller.signal);

      device().next("pending");
      device().next("completed");

      expect(states).toEqual(["pending", "completed"]);
      expect(subscriptionCount()).toBe(1);
    });

    it.each(["completed", "failed"])(
      "stops listening and does not cancel the action when the signal aborts after it %s",
      ending => {
        const controller = new AbortController();
        const removeEventListener = jest.spyOn(controller.signal, "removeEventListener");
        const { device, deviceAction } = startDeviceAction(controller.signal);
        if (ending === "completed") device().complete();
        else device().error(new Error("device locked"));

        controller.abort();

        expect(removeEventListener).toHaveBeenCalledWith("abort", expect.any(Function));
        expect(deviceAction.cancel).not.toHaveBeenCalled();
      },
    );
  });

  it("returns the device action untouched while no signal is given", () => {
    const { action, deviceAction } = startDeviceAction();

    expect(action).toBe(deviceAction);
  });

  it("sends every request while no signal is given", async () => {
    const { dmk, fakeDmk } = setup();

    await dmk.sendApdu({ sessionId: "session-1", apdu: GET_ADDRESS_APDU });
    await dmk.sendApdu({ sessionId: "session-1", apdu: GET_ADDRESS_APDU });

    expect(fakeDmk.sendApdu).toHaveBeenCalledTimes(2);
  });
});
