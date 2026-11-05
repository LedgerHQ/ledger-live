/**
 * @jest-environment jsdom
 */
import { CommandResultFactory, DeviceModelId } from "@ledgerhq/device-management-kit";
import { act, renderHook } from "@testing-library/react";
import * as host from "./host";
import type { DeviceOnboardingPorts } from "./ports";
import { settle } from "./tests/actorHarness";
import { createFakeOnboardingDmk } from "./tests/fakeDmk";
import { createOsVersionResponse } from "./tests/osVersionResponse";
import {
  useDeviceOnboardingActor,
  type OnboardingInspectionEvent,
  type UseDeviceOnboardingActorOptions,
} from "./useDeviceOnboardingActor";

jest.mock("./host", () => {
  const actual = jest.requireActual<typeof import("./host")>("./host");
  return {
    ...actual,
    createOnboardingEventLog: jest.fn(actual.createOnboardingEventLog),
    toolContext: jest.fn(actual.toolContext),
    nextStatesFrom: jest.fn(actual.nextStatesFrom),
  };
});

function ports(sessionId = "session-1"): DeviceOnboardingPorts {
  return {
    openSession: jest.fn(),
    currentSessionId: () => sessionId,
    closeSession: jest.fn(async () => undefined),
  };
}

const discards: (() => void)[] = [];

afterEach(() => {
  while (discards.length > 0) act(() => discards.pop()?.());
});

function renderActor(options: Partial<UseDeviceOnboardingActorOptions> = {}) {
  // An unseeded device the host sets up: the run waits for the user on its first screen.
  const fake = createFakeOnboardingDmk({
    osVersion: [
      CommandResultFactory({
        data: createOsVersionResponse({
          onboardingState: "welcome-screen-1",
          numberOfWords: 24,
          currentWordIndex: 0,
        }),
      }),
    ],
  });
  const rendered = renderHook(() =>
    useDeviceOnboardingActor({ missingSessionMessage: "No session", ...options }),
  );
  discards.push(() => rendered.result.current.discardActor());
  const start = async () => {
    rendered.result.current.portsRef.current = ports();
    act(() =>
      rendered.result.current.startActor({
        dmk: fake.dmk,
        deviceId: "device",
        deviceModelId: DeviceModelId.STAX,
        offerSync: false,
        hostsSeedSetup: true,
      }),
    );
    await act(() => settle());
  };
  return { ...rendered, start };
}

async function quit(result: { current: ReturnType<typeof useDeviceOnboardingActor> }) {
  act(() => result.current.send({ type: "QUIT" }));
  await act(() => settle());
}

describe("useDeviceOnboardingActor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs the machine without building any devtool data", async () => {
    const { result, start } = renderActor();

    await start();
    await quit(result);

    expect(result.current.exit?.reason).toBe("userQuit");
    expect(host.createOnboardingEventLog).not.toHaveBeenCalled();
    expect(host.toolContext).not.toHaveBeenCalled();
    expect(host.nextStatesFrom).not.toHaveBeenCalled();
  });

  it("hands every update to the observer, from the actor's creation", async () => {
    const seen: OnboardingInspectionEvent[] = [];
    const { result, start } = renderActor({ inspect: event => seen.push(event) });

    await start();

    const root = result.current.actorRef.current;
    expect(root).not.toBeNull();
    expect(seen[0]).toEqual(expect.objectContaining({ type: "@xstate.actor", actorRef: root }));
    expect(seen).toContainEqual(
      expect.objectContaining({
        type: "@xstate.snapshot",
        actorRef: root,
        event: expect.objectContaining({ type: "xstate.init" }),
      }),
    );
  });

  it("keeps the run going when the observer throws", async () => {
    const { result, start } = renderActor({
      inspect: () => {
        throw new Error("observer failure");
      },
    });

    await start();
    expect(result.current.state).not.toBeNull();

    await quit(result);
    expect(result.current.exit?.reason).toBe("userQuit");
  });

  it("publishes the snapshot of the current run, and its flat context", async () => {
    const { result, start } = renderActor();
    expect(result.current.snapshot).toBeNull();
    expect(result.current.context).toBeNull();

    await start();

    const snapshot = result.current.snapshot;
    expect(snapshot).toBe(result.current.actorRef.current?.getSnapshot());
    expect(result.current.state).toBe(host.stateValueToString(snapshot?.value));
    expect(result.current.context).toEqual(
      expect.objectContaining({ deviceModelId: DeviceModelId.STAX, offerSync: false }),
    );
  });

  it("lists the user events the current state accepts", async () => {
    const { result, start } = renderActor();
    expect(result.current.sendableEvents).toEqual([]);

    await start();

    expect(result.current.sendableEvents).toContainEqual({ event: { type: "QUIT" } });
  });

  it("clears the snapshot and the exit when the run is reset", async () => {
    const { result, start } = renderActor();
    await start();
    await quit(result);
    expect(result.current.exit).not.toBeNull();

    await act(() => result.current.resetActor());

    expect(result.current.snapshot).toBeNull();
    expect(result.current.state).toBeNull();
    expect(result.current.exit).toBeNull();
  });

  it("clears the snapshot when the run is discarded, and the host stops hearing it", async () => {
    const onEvent = jest.fn();
    const { result, start } = renderActor({ onEvent });
    await start();
    const actor = result.current.actorRef.current;

    act(() => result.current.discardActor());
    onEvent.mockClear();
    actor?.send({ type: "QUIT" });

    expect(result.current.snapshot).toBeNull();
    expect(result.current.actorRef.current).toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("tells the host about each event and the end of the run, then releases the actor", async () => {
    const onEvent = jest.fn();
    const onDone = jest.fn();
    const leaveOnboarding = jest.fn();
    const { result, start } = renderActor({ onEvent, onDone, leaveOnboarding });
    await start();
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "DEVICE_STATE_READ" }));

    await quit(result);

    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ reason: "userQuit" }));
    expect(leaveOnboarding).toHaveBeenCalledWith("userQuit", expect.any(Object));
    expect(result.current.actorRef.current).toBeNull();
  });
});
