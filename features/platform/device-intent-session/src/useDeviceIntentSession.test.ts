/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { EMPTY } from "rxjs";
import type { Intent } from "@features/platform-device-intent";
import {
  useDeviceIntentSession,
  type DeviceIntentSessionEvent,
  type DeviceIntentSessionOutcomes,
} from "./useDeviceIntentSession";

type JobState = { type: "verifying" } | { type: "verified" } | { type: "mismatch" };
type Outcome = "verified" | "mismatch" | "dismissed" | "setupFailed";
type SetupInput = { appName: string };
type TestIntent = Intent<JobState, undefined, undefined>;

const SETUP_INPUT: SetupInput = { appName: "Ethereum" };

function makeIntent(uuid: string): TestIntent {
  return {
    label: "test-intent",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: () => EMPTY,
    component: () => null,
    uuid,
    input: undefined,
  };
}

const intent = makeIntent("test-intent-uuid");

const outcomes: DeviceIntentSessionOutcomes<JobState, Outcome> = {
  fromJobState: jobState => (jobState.type === "verified" ? "verified" : undefined),
  fromUserCancel: lastJobState => (lastJobState?.type === "mismatch" ? "mismatch" : "dismissed"),
  setupFailed: "setupFailed",
};

type HookProps = Readonly<{
  buildSetupInput: () => Promise<SetupInput>;
  intent: TestIntent;
}>;

function setup({ buildSetupInput = () => Promise.resolve(SETUP_INPUT) } = {}) {
  const onExit = jest.fn<void, [Outcome]>();
  const onTrack = jest.fn<void, [DeviceIntentSessionEvent<JobState>]>();
  const onReady = jest.fn();
  const hook = renderHook(
    (props: HookProps) =>
      useDeviceIntentSession({
        ...props,
        intentComponentExtraProps: undefined,
        outcomes,
        onExit,
        onTrack,
        onReady,
      }),
    { initialProps: { buildSetupInput, intent } },
  );
  return { ...hook, onExit, onTrack, onReady };
}

async function renderReady(options?: Parameters<typeof setup>[0]) {
  const rendered = setup(options);
  await waitFor(() => expect(rendered.result.current).toBeDefined());
  return rendered;
}

function executorProps(result: ReturnType<typeof setup>["result"]) {
  if (result.current === undefined) throw new Error("session is not ready");
  return result.current;
}

describe("useDeviceIntentSession", () => {
  it("returns no executor props until the setup input is built", async () => {
    let resolveSetup: (input: SetupInput) => void = () => undefined;
    const buildSetupInput = () =>
      new Promise<SetupInput>(resolve => {
        resolveSetup = resolve;
      });

    const { result, onReady } = setup({ buildSetupInput });

    expect(result.current).toBeUndefined();
    expect(onReady).not.toHaveBeenCalled();

    await act(async () => resolveSetup(SETUP_INPUT));

    expect(result.current).toBeDefined();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("maps the setup input, intent and defaults to the executor props", async () => {
    const { result } = await renderReady();

    expect(result.current).toEqual({
      enabled: true,
      deviceConnectionParams: { acceptedDeviceModelIds: [] },
      deviceInitializationInput: SETUP_INPUT,
      intent,
      intentComponentExtraProps: undefined,
      onIntentJobStateChanged: expect.any(Function),
      onIntentJobComplete: expect.any(Function),
      onUserCancel: expect.any(Function),
    });
  });

  it("keeps the mount-time intent and setup input when the host passes new ones", async () => {
    const buildSetupInput = jest.fn(() => Promise.resolve(SETUP_INPUT));
    const { result, rerender } = await renderReady({ buildSetupInput });
    const propsBefore = result.current;

    rerender({
      buildSetupInput: () => Promise.resolve({ appName: "Bitcoin" }),
      intent: makeIntent("other-intent-uuid"),
    });

    expect(buildSetupInput).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(propsBefore);
  });

  it("waits for the job to complete before exiting with the outcome of its last state", async () => {
    const { result, onExit } = await renderReady();

    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "verified" }));

    expect(onExit).not.toHaveBeenCalled();

    act(() => executorProps(result).onIntentJobComplete?.());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it("keeps the session open when the job completes on a state that maps to no outcome", async () => {
    const { result, onExit } = await renderReady();

    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "verified" }));
    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "mismatch" }));
    act(() => executorProps(result).onIntentJobComplete?.());

    expect(onExit).not.toHaveBeenCalled();
  });

  it("exits with the outcome of the last job state when the user cancels", async () => {
    const { result, onExit } = await renderReady();

    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "mismatch" }));
    act(() => executorProps(result).onUserCancel());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("mismatch");
  });

  it("exits as dismissed when the user cancels before the job emits", async () => {
    const { result, onExit } = await renderReady();

    act(() => executorProps(result).onUserCancel());

    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("exits once even when the job completes and the user then cancels", async () => {
    const { result, onExit } = await renderReady();

    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "verified" }));
    act(() => executorProps(result).onIntentJobComplete?.());
    act(() => executorProps(result).onUserCancel());

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("ignores job states and completion after the session exited", async () => {
    const { result, onExit, onTrack } = await renderReady();

    act(() => executorProps(result).onUserCancel());
    onTrack.mockClear();
    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "verified" }));
    act(() => executorProps(result).onIntentJobComplete?.());

    expect(onTrack).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("tracks every job state and the user cancellation with the last job state", async () => {
    const { result, onTrack } = await renderReady();

    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "verifying" }));
    act(() => executorProps(result).onIntentJobStateChanged?.({ type: "mismatch" }));
    act(() => executorProps(result).onUserCancel());

    expect(onTrack.mock.calls.map(([event]) => event)).toEqual([
      { type: "jobStateChanged", jobState: { type: "verifying" } },
      { type: "jobStateChanged", jobState: { type: "mismatch" } },
      { type: "userCancelled", lastJobState: { type: "mismatch" } },
    ]);
  });

  it("exits with the setup failure outcome when the setup input cannot be built", async () => {
    const { result, onExit, onReady } = setup({
      buildSetupInput: () => Promise.reject(new Error("no device app")),
    });

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("setupFailed"));

    expect(result.current).toBeUndefined();
    expect(onReady).not.toHaveBeenCalled();
  });

  it("ignores a setup result that resolves after unmount", async () => {
    let resolveSetup: (input: SetupInput) => void = () => undefined;
    const { unmount, onReady } = setup({
      buildSetupInput: () =>
        new Promise<SetupInput>(resolve => {
          resolveSetup = resolve;
        }),
    });

    unmount();
    await act(async () => resolveSetup(SETUP_INPUT));

    expect(onReady).not.toHaveBeenCalled();
  });
});
