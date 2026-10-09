import {
  bufferToHexaString,
  CommandResultFactory,
  DeviceExchangeError,
  GlobalCommandErrorHandler,
  isCommandErrorCode,
  type ApduResponse,
  type CommandErrorArgs,
  type CommandErrors,
  type CommandResult,
} from "@ledgerhq/device-management-kit";

// See: https://github.com/LedgerHQ/app-hedera/blob/master/src/ui/app_globals.h
export type HederaErrorCodes = "6985" | "6980" | "6e00" | "6d00";

const HEDERA_APP_ERRORS: CommandErrors<HederaErrorCodes> = {
  "6985": { message: "User rejected" },
  "6980": { message: "Internal error" },
  "6e00": { message: "Malformed APDU" },
  "6d00": { message: "Unknown instruction" },
};

export class HederaAppCommandError extends DeviceExchangeError<HederaErrorCodes> {
  constructor(args: CommandErrorArgs<HederaErrorCodes>) {
    super({ tag: "HederaAppCommandError", ...args });
  }
}

export const hederaErrorResult = <T>(
  apduResponse: ApduResponse,
): CommandResult<T, HederaErrorCodes> => {
  const errorCode = bufferToHexaString(apduResponse.statusCode).replace("0x", "");

  if (isCommandErrorCode(errorCode, HEDERA_APP_ERRORS)) {
    return CommandResultFactory({
      error: new HederaAppCommandError({ ...HEDERA_APP_ERRORS[errorCode], errorCode }),
    });
  }

  return CommandResultFactory({ error: GlobalCommandErrorHandler.handle(apduResponse) });
};
