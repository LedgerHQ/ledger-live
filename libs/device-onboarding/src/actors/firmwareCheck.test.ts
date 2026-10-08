import { isCatalogueUnreachable } from "../device/errors";
import { CatalogueUnreachable } from "../errors";
import { createRetryPolicy } from "../retry";
import { runActor, settle } from "../tests/actorHarness";
import type { AvailableFirmwareUpdate } from "../types";
import { firmwareCheck, mapFirmwareLookup, type FirmwareCheckEvent } from "./firmwareCheck";

const availableUpdate = {
  mcuUpdateRequired: false,
  finalFirmware: { version: "1.5.0" },
} as unknown as AvailableFirmwareUpdate;

describe("mapFirmwareLookup", () => {
  it("reports an available update", () => {
    expect(mapFirmwareLookup(availableUpdate)).toEqual({
      type: "FIRMWARE_UPDATE_AVAILABLE",
      update: availableUpdate,
    });
  });

  it("reports a device already up to date", () => {
    expect(mapFirmwareLookup(null)).toEqual({ type: "FIRMWARE_UP_TO_DATE" });
  });
});

describe("firmwareCheck", () => {
  it("asks the catalogue port and does not run a device action", async () => {
    const lookupFirmwareUpdate = jest.fn<Promise<AvailableFirmwareUpdate | null>, []>(() =>
      Promise.resolve(null),
    );
    const { received, stop } = start(lookupFirmwareUpdate);

    await settle();

    expect(lookupFirmwareUpdate).toHaveBeenCalledTimes(1);
    expect(received).toEqual([{ type: "FIRMWARE_UP_TO_DATE" }]);
    stop();
  });

  it("reports the available update of an outdated device", async () => {
    const lookupFirmwareUpdate = jest.fn(() => Promise.resolve(availableUpdate));
    const { received, stop } = start(lookupFirmwareUpdate);

    await settle();

    expect(received).toEqual([{ type: "FIRMWARE_UPDATE_AVAILABLE", update: availableUpdate }]);
    stop();
  });

  it("reports a failed lookup as a failed check", async () => {
    const lookupFirmwareUpdate = jest.fn(() => Promise.reject(new Error("locked")));
    const { received, stop } = start(lookupFirmwareUpdate);

    await settle();

    expect(lookupFirmwareUpdate).toHaveBeenCalledTimes(1);
    expect(received).toEqual([{ type: "FIRMWARE_CHECK_FAILED" }]);
    stop();
  });

  it("retries an unreachable catalogue until it answers", async () => {
    const lookupFirmwareUpdate = jest
      .fn<Promise<AvailableFirmwareUpdate | null>, []>()
      .mockRejectedValueOnce(new CatalogueUnreachable())
      .mockResolvedValueOnce(null);
    const { received, stop } = start(lookupFirmwareUpdate);

    await settle();

    expect(lookupFirmwareUpdate).toHaveBeenCalledTimes(2);
    expect(received).toEqual([{ type: "FIRMWARE_UP_TO_DATE" }]);
    stop();
  });

  it("fails only once the retries are exhausted", async () => {
    const lookupFirmwareUpdate = jest.fn(() => Promise.reject(new CatalogueUnreachable()));
    const { received, stop } = start(lookupFirmwareUpdate);

    await settle();

    expect(lookupFirmwareUpdate).toHaveBeenCalledTimes(3);
    expect(received).toEqual([{ type: "FIRMWARE_CHECK_FAILED" }]);
    stop();
  });

  it("cancels the catalogue lookup when the actor stops", () => {
    const lookupFirmwareUpdate = jest.fn(
      (_signal: AbortSignal) => new Promise<AvailableFirmwareUpdate | null>(() => undefined),
    );
    const { stop } = start(lookupFirmwareUpdate);

    stop();

    expect(lookupFirmwareUpdate.mock.calls[0][0].aborted).toBe(true);
  });

  it("reports nothing once the actor is stopped", async () => {
    let resolveLookup: (update: AvailableFirmwareUpdate | null) => void = () => undefined;
    const lookupFirmwareUpdate = jest.fn(
      () =>
        new Promise<AvailableFirmwareUpdate | null>(resolve => {
          resolveLookup = resolve;
        }),
    );
    const { received, stop } = start(lookupFirmwareUpdate);

    stop();
    resolveLookup(null);
    await settle();

    expect(received).toEqual([]);
  });
});

function start(
  lookupFirmwareUpdate: (signal: AbortSignal) => Promise<AvailableFirmwareUpdate | null>,
) {
  return runActor<FirmwareCheckEvent>(firmwareCheck, {
    lookupFirmwareUpdate,
    retryPolicy: { ...createRetryPolicy(isCatalogueUnreachable), delaysMs: [0, 0] },
  });
}
