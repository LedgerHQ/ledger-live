import {
  ApduBuilder,
  bufferToHexaString,
  CommandResultFactory,
  CommandUtils,
  DeviceExchangeError,
  GlobalCommandErrorHandler,
  isCommandErrorCode,
  type Apdu,
  type ApduResponse,
  type Command,
  type CommandErrorArgs,
  type CommandErrors,
  type CommandResult,
} from "@ledgerhq/device-management-kit";

export const EarlyCheckToggle = {
  Enter: 0x00,
  Exit: 0x01,
} as const;

export type EarlyCheckToggle = (typeof EarlyCheckToggle)[keyof typeof EarlyCheckToggle];

export type ToggleEarlyCheckErrorCode = "6982" | "6700";

export const toggleEarlyCheckErrors: CommandErrors<ToggleEarlyCheckErrorCode> = {
  "6982": { message: "The device is no longer on a welcome step" },
  "6700": { message: "The firmware does not know the early check command" },
};

export class ToggleEarlyCheckCommandError extends DeviceExchangeError<ToggleEarlyCheckErrorCode> {
  constructor(args: CommandErrorArgs<ToggleEarlyCheckErrorCode>) {
    super({ tag: "ToggleEarlyCheckCommandError", ...args });
  }
}

/**
 * Moves the device in or out of the early security check step, without running any check. The
 * firmware only accepts it on the two welcome steps. DMK carries no command for this APDU, so it
 * is declared here, identical to `deviceSDK/commands/toggleOnboardingEarlyCheck` of
 * ledger-live-common, and this file is what goes away once DMK ships one.
 */
export class ToggleEarlyCheckCommand implements Command<void, void, ToggleEarlyCheckErrorCode> {
  readonly name = "toggleOnboardingEarlyCheck";
  readonly args = undefined;

  constructor(private readonly toggle: EarlyCheckToggle) {}

  getApdu(): Apdu {
    return new ApduBuilder({ cla: 0xe0, ins: 0x03, p1: 0x00, p2: this.toggle }).build();
  }

  parseResponse(apduResponse: ApduResponse): CommandResult<void, ToggleEarlyCheckErrorCode> {
    if (CommandUtils.isSuccessResponse(apduResponse)) {
      return CommandResultFactory({ data: undefined });
    }

    const errorCode = bufferToHexaString(apduResponse.statusCode).replace("0x", "");

    if (isCommandErrorCode(errorCode, toggleEarlyCheckErrors)) {
      return CommandResultFactory({
        error: new ToggleEarlyCheckCommandError({
          ...toggleEarlyCheckErrors[errorCode],
          errorCode,
        }),
      });
    }

    return CommandResultFactory({ error: GlobalCommandErrorHandler.handle(apduResponse) });
  }
}
