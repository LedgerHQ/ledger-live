import { firmwareSettled } from "./firmwareCheckState";
import type { AvailableFirmwareUpdate } from "./types";

describe("firmwareSettled", () => {
  it.each(["upToDate", "declined", "skipped", "deferred"] as const)(
    "treats %s as finished",
    kind => {
      expect(firmwareSettled({ kind })).toBe(true);
    },
  );

  it("leaves an offer and a missing check unfinished", () => {
    expect(firmwareSettled(null)).toBe(false);
    expect(
      firmwareSettled({
        kind: "offered",
        update: { finalFirmware: { version: "2.3.0" } } as AvailableFirmwareUpdate,
      }),
    ).toBe(false);
  });
});
