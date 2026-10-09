import {
  GenuineCheckDeviceAction,
  RefusedByUserDAError,
  SecureChannelError,
  UnknownDAError,
  UserInteractionRequired,
  type GenuineCheckDAError,
  type GenuineCheckDAIntermediateValue,
  type GenuineCheckDAOutput,
} from "@ledgerhq/device-management-kit";
import { DeviceActionStoppedError } from "../device/deviceAction";
import { isCatalogueUnreachable } from "../device/errors";
import { createRetryPolicy } from "../retry";
import { runActor, settle } from "../tests/actorHarness";
import { createFakeDeviceActionDmk, type FakeDeviceActionDmk } from "../tests/fakeDmk";
import { genuineCheck, mapGenuineCheckFailure, type GenuineCheckEvent } from "./genuineCheck";

type FakeGenuineCheckDmk = FakeDeviceActionDmk<
  GenuineCheckDAOutput,
  GenuineCheckDAError,
  GenuineCheckDAIntermediateValue
>;

const webSocketConnectionError = { _tag: "WebSocketConnectionError" } as GenuineCheckDAError;
const catalogueUnreachable = { _tag: "FetchError" } as GenuineCheckDAError;

describe("mapGenuineCheckFailure", () => {
  it("reports a refusal on the device as a refusal", () => {
    const error = new RefusedByUserDAError();

    expect(mapGenuineCheckFailure(error)).toEqual({
      type: "GENUINE_CHECK_REFUSED",
      output: error,
    });
  });

  it.each([
    ["a secure channel error", new SecureChannelError(new Error("closed"))],
    ["a websocket error", webSocketConnectionError],
  ])("reports %s as a lost secure channel", (_, error) => {
    expect(mapGenuineCheckFailure(error)).toEqual({
      type: "SECURE_CHANNEL_LOST",
      output: error,
    });
  });

  it.each([
    ["an unknown device action error", new UnknownDAError()],
    ["an unreachable catalogue", catalogueUnreachable],
    ["an error without a tag", new Error("boom")],
  ])("reports %s as a failure", (_, error) => {
    expect(mapGenuineCheckFailure(error)).toEqual({
      type: "GENUINE_CHECK_FAILED",
      output: error,
    });
  });

  it.each([
    ["a refusal", new RefusedByUserDAError()],
    ["a lost secure channel", new SecureChannelError(new Error("closed"))],
    ["an unreachable catalogue", catalogueUnreachable],
  ])("hands the app %s untouched rather than a copy of it", (_, error) => {
    expect(mapGenuineCheckFailure(error).output).toBe(error);
  });
});

describe("genuineCheck", () => {
  it("checks a device that is not onboarded yet", () => {
    const fake = createFake();
    const { stop } = start(fake);

    expect(fake.executeDeviceAction).toHaveBeenCalledWith({
      sessionId: "session",
      deviceAction: expect.any(GenuineCheckDeviceAction),
    });
    expect(fake.executeDeviceAction.mock.calls[0][0].deviceAction.input).toEqual({
      allowNonOnboardedDevice: true,
    });
    stop();
  });

  it("reports a genuine device as passed", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    complete(fake, true);
    await settle();

    expect(received).toEqual([{ type: "GENUINE_CHECK_PASSED", output: { isGenuine: true } }]);
    stop();
  });

  it("reports a device that is not genuine, carrying the verdict it was given", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    complete(fake, false);
    await settle();

    expect(received).toEqual([{ type: "DEVICE_NOT_GENUINE", output: { isGenuine: false } }]);
    stop();
  });

  it("asks the user to allow the secure connection", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    pending(fake, UserInteractionRequired.UnlockDevice);
    pending(fake, UserInteractionRequired.AllowSecureConnection);
    await settle();

    expect(received).toEqual([{ type: "ALLOW_SECURE_CONNECTION_REQUESTED" }]);
    stop();
  });

  it("stays on the prompt when the device repeats the same request", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    pending(fake, UserInteractionRequired.AllowSecureConnection);
    pending(fake, UserInteractionRequired.AllowSecureConnection);
    pending(fake, UserInteractionRequired.AllowSecureConnection);
    await settle();

    expect(received).toEqual([{ type: "ALLOW_SECURE_CONNECTION_REQUESTED" }]);
    stop();
  });

  it("records the allow when the prompt goes away", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    pending(fake, UserInteractionRequired.AllowSecureConnection);
    pending(fake, UserInteractionRequired.None);
    await settle();

    expect(received).toEqual([
      { type: "ALLOW_SECURE_CONNECTION_REQUESTED" },
      { type: "SECURE_CONNECTION_ALLOWED" },
    ]);
    stop();
  });

  it("asks again after the prompt has gone away", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    pending(fake, UserInteractionRequired.AllowSecureConnection);
    pending(fake, UserInteractionRequired.None);
    pending(fake, UserInteractionRequired.AllowSecureConnection);
    await settle();

    expect(received).toEqual([
      { type: "ALLOW_SECURE_CONNECTION_REQUESTED" },
      { type: "SECURE_CONNECTION_ALLOWED" },
      { type: "ALLOW_SECURE_CONNECTION_REQUESTED" },
    ]);
    stop();
  });

  it.each([
    ["a refusal on the device", "GENUINE_CHECK_REFUSED", new RefusedByUserDAError()],
    ["a lost secure channel", "SECURE_CHANNEL_LOST", new SecureChannelError(new Error("closed"))],
    ["a lost websocket", "SECURE_CHANNEL_LOST", webSocketConnectionError],
    ["an unknown error", "GENUINE_CHECK_FAILED", new UnknownDAError()],
  ])("reports %s as %s", async (_, type, error) => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fail(fake, error as GenuineCheckDAError);
    await settle();

    expect(received).toEqual([{ type, output: error }]);
    stop();
  });

  it("reports a stopped device action as a failure", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fake.lastExecution().stop();
    await settle();

    expect(received).toEqual([
      {
        type: "GENUINE_CHECK_FAILED",
        output: expect.any(DeviceActionStoppedError),
      },
    ]);
    stop();
  });

  it("retries an unreachable catalogue until it answers", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fail(fake, catalogueUnreachable);
    await settle();
    complete(fake, true);
    await settle();

    expect(fake.executions).toHaveLength(2);
    expect(received).toEqual([{ type: "GENUINE_CHECK_PASSED", output: { isGenuine: true } }]);
    stop();
  });

  it("fails only once the retries are exhausted", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    for (let attempt = 0; attempt < 3; attempt++) {
      fail(fake, catalogueUnreachable);
      await settle();
    }

    expect(fake.executions).toHaveLength(3);
    expect(received).toEqual([{ type: "GENUINE_CHECK_FAILED", output: catalogueUnreachable }]);
    stop();
  });

  it("does not start another device action when it is stopped during a retry delay", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fail(fake, catalogueUnreachable);
    stop();
    await settle();

    expect(fake.executions).toHaveLength(1);
    expect(received).toEqual([]);
  });

  it("does not retry an error the policy rejects", async () => {
    const fake = createFake();
    const { stop } = start(fake);

    fail(fake, new UnknownDAError());
    await settle();

    expect(fake.executions).toHaveLength(1);
    stop();
  });

  it("cancels the device action and unsubscribes when the actor stops", () => {
    const fake = createFake();
    const { stop } = start(fake);
    const execution = fake.lastExecution();

    expect(execution.watched).toBe(true);

    stop();

    expect(execution.watched).toBe(false);
    expect(execution.cancel).toHaveBeenCalledTimes(1);
  });

  it("reports nothing once the actor is stopped", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);
    const execution = fake.lastExecution();

    stop();
    execution.complete({ isGenuine: true });
    await settle();

    expect(received).toEqual([]);
  });
});

function createFake(): FakeGenuineCheckDmk {
  return createFakeDeviceActionDmk<
    GenuineCheckDAOutput,
    GenuineCheckDAError,
    GenuineCheckDAIntermediateValue
  >();
}

function start(fake: FakeGenuineCheckDmk) {
  return runActor<GenuineCheckEvent>(genuineCheck, {
    dmk: fake.dmk,
    sessionId: "session",
    retryPolicy: { ...createRetryPolicy(isCatalogueUnreachable), delaysMs: [0, 0] },
  });
}

function complete(fake: FakeGenuineCheckDmk, isGenuine: boolean) {
  fake.lastExecution().complete({ isGenuine });
}

function pending(fake: FakeGenuineCheckDmk, requiredUserInteraction: UserInteractionRequired) {
  fake.lastExecution().pending({
    requiredUserInteraction,
  } as GenuineCheckDAIntermediateValue);
}

function fail(fake: FakeGenuineCheckDmk, error: GenuineCheckDAError) {
  fake.lastExecution().fail(error);
}
