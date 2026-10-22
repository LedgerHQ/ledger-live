import { ApduResponse, isSuccessCommandResult } from "@ledgerhq/device-management-kit";
import { EarlyCheckToggle, ToggleEarlyCheckCommand } from "./toggleEarlyCheckCommand";

describe("ToggleEarlyCheckCommand", () => {
  it.each([
    ["entering", EarlyCheckToggle.Enter, 0x00],
    ["leaving", EarlyCheckToggle.Exit, 0x01],
  ])("builds the %s APDU", (_, toggle, expectedP2) => {
    const apdu = new ToggleEarlyCheckCommand(toggle).getApdu();

    expect([apdu.cla, apdu.ins, apdu.p1, apdu.p2]).toEqual([0xe0, 0x03, 0x00, expectedP2]);
    expect(apdu.data).toHaveLength(0);
  });

  it("succeeds on a 9000 response", () => {
    const result = new ToggleEarlyCheckCommand(EarlyCheckToggle.Enter).parseResponse(
      apduResponse(0x90, 0x00),
    );

    expect(isSuccessCommandResult(result)).toBe(true);
  });

  it.each([
    ["6982", 0x69, 0x82, "The device is no longer on a welcome step"],
    ["6700", 0x67, 0x00, "The firmware does not know the early check command"],
  ])("names the %s failure", (errorCode, first, second, message) => {
    const result = new ToggleEarlyCheckCommand(EarlyCheckToggle.Enter).parseResponse(
      apduResponse(first, second),
    );

    expect(isSuccessCommandResult(result)).toBe(false);
    expect(result).toMatchObject({ error: { errorCode, message } });
  });

  it("falls back to the global handler on an unlisted status code", () => {
    const result = new ToggleEarlyCheckCommand(EarlyCheckToggle.Enter).parseResponse(
      apduResponse(0x6e, 0x00),
    );

    expect(isSuccessCommandResult(result)).toBe(false);
    expect(result).toMatchObject({ error: { errorCode: "6e00" } });
  });
});

function apduResponse(...statusCode: number[]): ApduResponse {
  return new ApduResponse({
    statusCode: Uint8Array.from(statusCode),
    data: new Uint8Array(),
  });
}
