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

  it.each([0x00, 0x20])("reads low nibble 0 of 0x%s as no backup pending", bits => {
    const data = Uint8Array.from(flexBackupChoice);
    data[data.length - 1] = bits;

    expect(readRecoveryKeyStatus(data, DeviceModelId.FLEX, "1.4.0")).toBe(RecoveryKeyStatus.None);
  });

  it("reads an unmapped nibble as unknown", () => {
    const data = Uint8Array.from(flexBackupChoice);
    data[data.length - 1] = 0x06;

    expect(readRecoveryKeyStatus(data, DeviceModelId.FLEX, "1.4.0")).toBe(
      RecoveryKeyStatus.Unknown,
    );
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

  it("reads the field from the first Flex version that has a Recovery Key", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.FLEX, "1.3.0")).toBe(
      RecoveryKeyStatus.Choice,
    );
  });

  it("ignores the field on a Flex older than the Recovery Key", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.FLEX, "1.2.0")).toBeNull();
  });

  it("reads the field on an Apex", () => {
    expect(readRecoveryKeyStatus(flexBackupChoice, DeviceModelId.APEX, "0.0.0")).toBe(
      RecoveryKeyStatus.Choice,
    );
  });

  it("reports an unknown flag when a supported device omits the field", () => {
    expect(
      readRecoveryKeyStatus(flexBackupChoice.subarray(0, 20), DeviceModelId.FLEX, "1.4.0"),
    ).toBe(RecoveryKeyStatus.Unknown);
  });

  it("reports an unknown flag when the Recovery Key field is empty", () => {
    const data = Uint8Array.from(flexBackupChoice);
    data[data.length - 2] = 0;

    expect(
      readRecoveryKeyStatus(data.subarray(0, data.length - 1), DeviceModelId.FLEX, "1.4.0"),
    ).toBe(RecoveryKeyStatus.Unknown);
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

  it("reads a device that is ready and waiting on the Recovery Key choice", () => {
    const data = Uint8Array.from(flexBackupChoice);
    data[14] = 0x0b;

    const result = new ReadOnboardingVersionCommand().parseResponse(
      new ApduResponse({
        statusCode: Uint8Array.from([0x90, 0x00]),
        data,
      }),
      DeviceModelId.FLEX,
    );

    expect(isSuccessCommandResult(result)).toBe(true);

    if (!isSuccessCommandResult(result)) {
      return;
    }

    expect(result.data.secureElementFlags.onboardingState).toBe("device-is-ready");
    expect(result.data.recoveryKeyStatus).toBe(RecoveryKeyStatus.Choice);
  });
});

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g)?.map(pair => Number.parseInt(pair, 16)) ?? []);
}
