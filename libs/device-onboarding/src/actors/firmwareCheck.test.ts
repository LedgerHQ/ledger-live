import {
  DeviceActionStatus,
  GetDeviceMetadataDeviceAction,
  UnknownDAError,
  type GetDeviceMetadataDAError,
  type GetDeviceMetadataDAIntermediateValue,
  type GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import { isCatalogueUnreachable } from "../device/errors";
import { createRetryPolicy } from "../retry";
import { runActor, settle } from "../tests/actorHarness";
import { createFakeDeviceActionDmk, type FakeDeviceActionDmk } from "../tests/fakeDmk";
import type { AvailableFirmwareUpdate } from "../types";
import { firmwareCheck, mapFirmwareMetadata, type FirmwareCheckEvent } from "./firmwareCheck";

type FakeFirmwareCheckDmk = FakeDeviceActionDmk<
  GetDeviceMetadataDAOutput,
  GetDeviceMetadataDAError,
  GetDeviceMetadataDAIntermediateValue
>;

const availableUpdate = {
  mcuUpdateRequired: false,
  finalFirmware: { version: "1.5.0" },
} as unknown as AvailableFirmwareUpdate;
const catalogueUnreachable = { _tag: "FetchError" } as GetDeviceMetadataDAError;

describe("mapFirmwareMetadata", () => {
  it("reports an available update", () => {
    expect(mapFirmwareMetadata(metadata(availableUpdate))).toEqual({
      type: "FIRMWARE_UPDATE_AVAILABLE",
      update: availableUpdate,
    });
  });

  it("reports a device already up to date", () => {
    expect(mapFirmwareMetadata(metadata(undefined))).toEqual({ type: "FIRMWARE_UP_TO_DATE" });
  });
});

describe("firmwareCheck", () => {
  it("reads the metadata of a device that is not onboarded yet", () => {
    const fake = createFake();
    const { stop } = start(fake);

    expect(fake.executeDeviceAction).toHaveBeenCalledWith({
      sessionId: "session",
      deviceAction: expect.any(GetDeviceMetadataDeviceAction),
    });
    expect(fake.executeDeviceAction.mock.calls[0][0].deviceAction.input).toEqual({
      useSecureChannel: true,
      forceUpdate: false,
      allowNonOnboardedDevice: true,
    });
    stop();
  });

  it("reports the available update of an outdated device", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    complete(fake, availableUpdate);
    await settle();

    expect(received).toEqual([{ type: "FIRMWARE_UPDATE_AVAILABLE", update: availableUpdate }]);
    stop();
  });

  it("reports a device already up to date", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    complete(fake, undefined);
    await settle();

    expect(received).toEqual([{ type: "FIRMWARE_UP_TO_DATE" }]);
    stop();
  });

  it("reports a failed metadata read as a failed check", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fail(fake, new UnknownDAError());
    await settle();

    expect(fake.executions).toHaveLength(1);
    expect(received).toEqual([{ type: "FIRMWARE_CHECK_FAILED" }]);
    stop();
  });

  it("reports a stopped device action as a failed check", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fake.lastExecution().states.next({ status: DeviceActionStatus.Stopped });
    await settle();

    expect(received).toEqual([{ type: "FIRMWARE_CHECK_FAILED" }]);
    stop();
  });

  it("retries an unreachable catalogue until it answers", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);

    fail(fake, catalogueUnreachable);
    await settle();
    complete(fake, undefined);
    await settle();

    expect(fake.executions).toHaveLength(2);
    expect(received).toEqual([{ type: "FIRMWARE_UP_TO_DATE" }]);
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
    expect(received).toEqual([{ type: "FIRMWARE_CHECK_FAILED" }]);
    stop();
  });

  it("cancels the device action and unsubscribes when the actor stops", () => {
    const fake = createFake();
    const { stop } = start(fake);
    const { states, cancel } = fake.lastExecution();

    expect(states.observed).toBe(true);

    stop();

    expect(states.observed).toBe(false);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("reports nothing once the actor is stopped", async () => {
    const fake = createFake();
    const { received, stop } = start(fake);
    const execution = fake.lastExecution();

    stop();
    execution.states.next({
      status: DeviceActionStatus.Completed,
      output: metadata(undefined),
    });
    await settle();

    expect(received).toEqual([]);
  });
});

function metadata(update: AvailableFirmwareUpdate | undefined): GetDeviceMetadataDAOutput {
  return { firmwareUpdateContext: { availableUpdate: update } } as GetDeviceMetadataDAOutput;
}

function createFake(): FakeFirmwareCheckDmk {
  return createFakeDeviceActionDmk<
    GetDeviceMetadataDAOutput,
    GetDeviceMetadataDAError,
    GetDeviceMetadataDAIntermediateValue
  >();
}

function start(fake: FakeFirmwareCheckDmk) {
  return runActor<FirmwareCheckEvent>(firmwareCheck, {
    dmk: fake.dmk,
    sessionId: "session",
    retryPolicy: { ...createRetryPolicy(isCatalogueUnreachable), delaysMs: [0, 0] },
  });
}

function complete(fake: FakeFirmwareCheckDmk, update: AvailableFirmwareUpdate | undefined) {
  fake.lastExecution().states.next({
    status: DeviceActionStatus.Completed,
    output: metadata(update),
  });
}

function fail(fake: FakeFirmwareCheckDmk, error: GetDeviceMetadataDAError) {
  fake.lastExecution().states.next({ status: DeviceActionStatus.Error, error });
}
