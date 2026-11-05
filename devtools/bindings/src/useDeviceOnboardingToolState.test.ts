import { useLayoutEffect, useRef } from "react";
import { act, renderHook } from "@testing-library/react";
import { CommandResultFactory, DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createOnboardingEventLog,
  nextStatesFrom,
  stateValueToString,
  toolContext,
  useDeviceOnboardingActor,
  type DeviceOnboardingPorts,
  type HostLogRow,
  type HostToolEvent,
  type OnboardingEvent,
  type OnboardingInspectionEvent,
} from "@features/platform-device-onboarding";
import {
  createFakeOnboardingDmk,
  createOsVersionResponse,
} from "@features/platform-device-onboarding/testing";
import { useDeviceOnboardingToolState } from "./useDeviceOnboardingToolState";

/**
 * The log as the product hook built it before the devtool owned it: one row per update of the run's
 * root actor, the newest 200 rows.
 */
function createReferenceLog(currentSessionId: () => string | undefined) {
  let rows: HostLogRow[] = [];
  let root: unknown = null;
  const lastLoggedStep = { current: null as string | null };
  const sequence = { current: 0 };
  return {
    rows: () => rows,
    inspect(inspectionEvent: OnboardingInspectionEvent) {
      if (inspectionEvent.type === "@xstate.actor" && root === null)
        root = inspectionEvent.actorRef;
      if (inspectionEvent.type !== "@xstate.snapshot") return;
      if (inspectionEvent.actorRef !== root) return;
      if (!("value" in inspectionEvent.snapshot)) return;
      const event = inspectionEvent.event.type.startsWith("xstate.")
        ? null
        : (inspectionEvent.event as OnboardingEvent);
      const state = stateValueToString(inspectionEvent.snapshot.value);
      const entries: HostToolEvent[] = [];
      if (event) {
        createOnboardingEventLog({
          currentSessionId,
          lastLoggedStep,
          sequence,
          push: entry => entries.push(entry),
        })(event);
      }
      const [entry] = entries;
      if (entry) rows = [...rows.slice(-199), { state, event: entry }];
      else if (rows.at(-1)?.state !== state) rows = [...rows.slice(-199), { state }];
    },
  };
}

function ports(sessionId: string): DeviceOnboardingPorts {
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

async function settle() {
  for (let cycle = 0; cycle < 4; cycle++) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

function renderRun(observe: (event: OnboardingInspectionEvent) => void = () => undefined) {
  const rendered = renderHook(() => {
    const inspectRef = useRef<(event: OnboardingInspectionEvent) => void>(() => undefined);
    const session = useDeviceOnboardingActor({
      missingSessionMessage: "No session",
      inspect: event => {
        observe(event);
        inspectRef.current(event);
      },
    });
    const toolState = useDeviceOnboardingToolState({
      snapshot: session.snapshot,
      portsRef: session.portsRef,
    });
    useLayoutEffect(() => {
      inspectRef.current = toolState.inspect;
    }, [toolState.inspect]);
    return { session, toolState };
  });
  discards.push(() => rendered.result.current.session.discardActor());

  const start = async (sessionId = "session-1") => {
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
    rendered.result.current.session.portsRef.current = ports(sessionId);
    act(() =>
      rendered.result.current.session.startActor({
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

describe("useDeviceOnboardingToolState", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("replays a run into the same log, context and next states as the product hook built", async () => {
    let sessionId = "session-1";
    const reference = createReferenceLog(() => sessionId);
    const { result, start } = renderRun(event => reference.inspect(event));

    await start();
    act(() => result.current.session.send({ type: "LOCKED" }));
    act(() => result.current.session.send({ type: "UNLOCKED" }));
    await act(() => settle());
    sessionId = "session-2";
    result.current.session.portsRef.current = ports(sessionId);
    act(() => result.current.session.sendToActor({ type: "TRANSPORT_LOST" }));
    await act(() => settle());

    const { log, machineContext, nextStates } = result.current.toolState;
    const snapshot = result.current.session.actorRef.current?.getSnapshot() ?? null;
    expect(log).toEqual(reference.rows());
    expect(log.map(row => row.event?.type)).toEqual(
      expect.arrayContaining(["DEVICE_STATE_READ", "LOCKED", "UNLOCKED", "TRANSPORT_LOST"]),
    );
    expect(log.find(row => row.event?.type === "TRANSPORT_LOST")?.event?.detail).toEqual({
      kind: "session",
      sessionId: "session-2",
    });
    expect(machineContext).toEqual(snapshot && toolContext(snapshot.context));
    expect(nextStates).toEqual(nextStatesFrom(snapshot));
    expect(nextStates.length).toBeGreaterThan(0);
  });

  it("starts the log at the actor's creation, with the initial state", async () => {
    const { result, start } = renderRun();

    await start();

    const [first] = result.current.toolState.log;
    expect(first).toEqual({ state: "readingState" });
  });

  it("keeps the newest 200 rows", async () => {
    const { result, start } = renderRun();
    await start();

    for (let index = 0; index < 150; index++) {
      act(() => result.current.session.send({ type: "LOCKED" }));
      act(() => result.current.session.send({ type: "UNLOCKED" }));
    }
    await act(() => settle());

    expect(result.current.toolState.log).toHaveLength(200);
    const lockRows = result.current.toolState.log.filter(
      row => row.event?.type === "LOCKED" || row.event?.type === "UNLOCKED",
    );
    expect(lockRows.at(-1)?.event?.type).toBe("UNLOCKED");
  });

  it("restarts the log when a new run starts", async () => {
    const { result, start } = renderRun();
    await start();
    act(() => result.current.session.send({ type: "QUIT" }));
    await act(() => settle());
    expect(result.current.toolState.log.some(row => row.event?.type === "QUIT")).toBe(true);

    await start();

    expect(result.current.toolState.log[0]).toEqual({ state: "readingState" });
    expect(result.current.toolState.log.some(row => row.event?.type === "QUIT")).toBe(false);
  });

  it("keeps the values of the end of a run that quit on its own", async () => {
    const { result, start } = renderRun();
    await start();

    act(() => result.current.session.send({ type: "QUIT" }));
    await act(() => settle());

    expect(result.current.session.actorRef.current).toBeNull();
    expect(result.current.toolState.log.at(-1)?.event?.type).toBe("QUIT");
    expect(result.current.toolState.machineContext).not.toBeNull();
  });

  it("freezes the context and next states while a reset quits, then clears everything", async () => {
    const { result, start } = renderRun();
    await start();
    const before = result.current.toolState;
    expect(before.nextStates.length).toBeGreaterThan(0);

    let resetting: Promise<void> = Promise.resolve();
    act(() => {
      resetting = result.current.session.resetActor();
    });

    expect(result.current.toolState.machineContext).toBe(before.machineContext);
    expect(result.current.toolState.nextStates).toBe(before.nextStates);
    expect(result.current.toolState.log.at(-1)?.event?.type).toBe("QUIT");

    await act(() => resetting);

    expect(result.current.toolState.log).toEqual([]);
    expect(result.current.toolState.machineContext).toBeNull();
    expect(result.current.toolState.nextStates).toEqual([]);
  });

  it("clears everything when the run is discarded", async () => {
    const { result, start } = renderRun();
    await start();
    expect(result.current.toolState.log).not.toEqual([]);

    act(() => result.current.session.discardActor());

    expect(result.current.toolState.log).toEqual([]);
    expect(result.current.toolState.machineContext).toBeNull();
    expect(result.current.toolState.nextStates).toEqual([]);
  });
});
