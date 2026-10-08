import {
  CommandResultFactory,
  DeviceModelId,
  GetOsVersionCommand,
  isSuccessCommandResult,
  type Apdu,
  type ApduResponse,
  type Command,
  type CommandResult,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import type { RecoveryKeyStatus } from "../types";
import { readRecoveryKeyStatus } from "./recoveryKeyStatus";

export type OnboardingVersion = GetOsVersionResponse & {
  recoveryKeyStatus: RecoveryKeyStatus | null;
};

export class ReadOnboardingVersionCommand implements Command<OnboardingVersion> {
  readonly name = "getOsVersion";
  readonly args = undefined;

  getApdu(): Apdu {
    return new GetOsVersionCommand().getApdu();
  }

  parseResponse(
    apduResponse: ApduResponse,
    deviceModelId: DeviceModelId | void,
  ): CommandResult<OnboardingVersion> {
    const model = deviceModelId || DeviceModelId.NANO_S;
    const parsed = new GetOsVersionCommand().parseResponse(apduResponse, model);

    if (!isSuccessCommandResult(parsed)) {
      return parsed;
    }

    const recoveryKeyStatus =
      !deviceModelId || parsed.data.isBootloader || parsed.data.isOsu
        ? null
        : readRecoveryKeyStatus(apduResponse.data, deviceModelId, parsed.data.seVersion);

    return CommandResultFactory({
      data: { ...parsed.data, recoveryKeyStatus },
    });
  }
}
