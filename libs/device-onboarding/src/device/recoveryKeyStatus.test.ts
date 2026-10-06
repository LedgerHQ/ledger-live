import {
  ApduResponse,
  DeviceModelId,
  isSuccessCommandResult,
} from "@ledgerhq/device-management-kit";
import { RecoveryKeyStatus } from "../types";
import { ReadOnboardingVersionCommand } from "./onboardingVersionCommand";
import { readRecoveryKeyStatus } from "./recoveryKeyStatus";

const flexBackupChoice = bytes(
  "33300004" +
    "05312e342e30" +
    "04ee000000" +
    "05362e352e32" +
    "05352e352e32" +
    "0100" +
    "0106" +
    "0102",
);

describe("readRecoveryKeyStatus", () => {
  it("reads the choice flag on a Flex that is already seeded", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.FLEX, "1.4.0")).toBe(
      RecoveryKeyStatus.Choice,
    );
  });

  it.each([
    [0x03, RecoveryKeyStatus.Running],
    [0x04, RecoveryKeyStatus.Naming],
    [0x05, RecoveryKeyStatus.Ready],
    [0x01, RecoveryKeyStatus.Rejected],
    [0x23, RecoveryKeyStatus.Running],
  ])("reads low nibble 0x%s as %s", (bits, status) => {
    const data = Uint8Array.from(flexBackupChoice);
    data[data.length - 1] = bits;

    expect(readRecoveryKeyStatus(data, DeviceModelId.FLEX, "1.4.0")).toBe(status);
  });

  it.each([0x00, 0x20])("has no backup flag for 0x%s", bits => {
    const data = Uint8Array.from(flexBackupChoice);
    data[data.length - 1] = bits;

    expect(readRecoveryKeyStatus(data, DeviceModelId.FLEX, "1.4.0")).toBeNull();
  });

  it("ignores the field on a Nano X, which has no Recovery Key", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.NANO_X, "2.4.0")).toBeNull();
  });

  it("ignores the field on a Stax older than the Recovery Key", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.STAX, "1.6.0")).toBeNull();
  });

  it("reads the field once a Stax is new enough", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.STAX, "1.7.0")).toBe(
      RecoveryKeyStatus.Choice,
    );
  });

  it("has no flag when the reply stops before the field", () => {
    expect(
      readRecoveryKeyStatus(flexBackupChoice.subarray(0, 20), DeviceModelId.FLEX, "1.4.0"),
    ).toBeNull();
  });
});

describe("ReadOnboardingVersionCommand", () => {
  it("attaches the Recovery Key flag DMK leaves off the version response", () => {
    const result = new ReadOnboardingVersionCommand().parseResponse(
      new ApduResponse({
        statusCode: Uint8Array.from([0x90, 0x00]),
        data: flexBackupChoice,
      }),
      DeviceModelId.FLEX,
    );

    expect(isSuccessCommandResult(result)).toBe(true);

    if (!isSuccessCommandResult(result)) {
      return;
    }

    expect(result.data.seVersion).toBe("1.4.0");
    expect(result.data.secureElementFlags.onboardingState).toBe("welcome-screen-1");
    expect(result.data.recoveryKeyStatus).toBe(RecoveryKeyStatus.Choice);
  });
});

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g)?.map(pair => Number.parseInt(pair, 16)) ?? []);
}
