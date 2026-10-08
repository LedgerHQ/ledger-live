import {
  ApduResponse,
  CommandResultFactory,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  EarlyCheckToggle,
  ToggleEarlyCheckCommand,
  type ToggleEarlyCheckErrorCode,
} from "../device/toggleEarlyCheckCommand";
import { runActor, settle } from "../tests/actorHarness";
import { createFakeCommandDmk, type ScriptedCommand } from "../tests/fakeDmk";
import { toggleEarlyCheck, type ToggleEarlyCheckEvent } from "./toggleEarlyCheck";

describe("toggleEarlyCheck", () => {
  it.each([
    ["entering", EarlyCheckToggle.Enter, 0x00],
    ["leaving", EarlyCheckToggle.Exit, 0x01],
  ])("sends the %s command", async (_, toggle, expectedP2) => {
    const { dmk, sendCommand } = createFakeCommandDmk([CommandResultFactory({ data: undefined })]);
    const { received, stop } = start(dmk, toggle);

    await settle();

    expect(sendCommand.mock.calls[0][0].command.getApdu().p2).toBe(expectedP2);
    expect(received).toEqual([{ type: "EARLY_CHECK_TOGGLED" }]);
    stop();
  });

  it.each([
    ["the device left the welcome step", 0x69, 0x82],
    ["the firmware does not know the APDU", 0x67, 0x00],
    ["the status code is unexpected", 0x6e, 0x00],
  ])("carries on when %s", async (_, first, second) => {
    const { dmk } = createFakeCommandDmk([deviceRefuses(first, second)]);
    const { received, stop } = start(dmk);

    await settle();

    expect(received).toEqual([{ type: "EARLY_CHECK_UNAVAILABLE" }]);
    stop();
  });

  it("carries on when the transport fails", async () => {
    const { dmk } = createFakeCommandDmk([{ throws: new Error("transport failed") }]);
    const { received, stop } = start(dmk);

    await settle();

    expect(received).toEqual([{ type: "EARLY_CHECK_UNAVAILABLE" }]);
    stop();
  });

  it("does not retry a failure", async () => {
    const { dmk, sendCommand } = createFakeCommandDmk([{ throws: new Error("transport failed") }]);
    const { stop } = start(dmk);

    await settle();

    expect(sendCommand).toHaveBeenCalledTimes(1);
    stop();
  });

  it("reports nothing once the actor is stopped", async () => {
    const { dmk } = createFakeCommandDmk([CommandResultFactory({ data: undefined })]);
    const { received, stop } = start(dmk);

    stop();
    await settle();

    expect(received).toEqual([]);
  });
});

function deviceRefuses(...statusCode: number[]): ScriptedCommand<void, ToggleEarlyCheckErrorCode> {
  return new ToggleEarlyCheckCommand(EarlyCheckToggle.Enter).parseResponse(
    new ApduResponse({ statusCode: Uint8Array.from(statusCode), data: new Uint8Array() }),
  );
}

function start(dmk: DeviceManagementKit, toggle: EarlyCheckToggle = EarlyCheckToggle.Enter) {
  return runActor<ToggleEarlyCheckEvent>(toggleEarlyCheck, { dmk, sessionId: "session", toggle });
}
