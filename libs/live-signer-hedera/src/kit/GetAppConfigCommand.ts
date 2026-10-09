import {
  ApduBuilder,
  ApduParser,
  CommandResultFactory,
  CommandUtils,
  InvalidStatusWordError,
  type Apdu,
  type ApduResponse,
  type Command,
  type CommandResult,
} from "@ledgerhq/device-management-kit";
import { buildApduOrThrow } from "./apdu";
import { CLA, INS } from "./constants";
import { hederaErrorResult, type HederaErrorCodes } from "./HederaAppErrors";

export type GetAppConfigCommandResponse = {
  readonly storageAllowed: boolean;
  readonly version: string;
};

export class GetAppConfigCommand implements Command<
  GetAppConfigCommandResponse,
  void,
  HederaErrorCodes
> {
  readonly name = "GetAppConfig";
  readonly args = undefined;

  getApdu(): Apdu {
    return buildApduOrThrow(
      new ApduBuilder({ cla: CLA, ins: INS.GET_APP_CONFIGURATION, p1: 0x00, p2: 0x00 }),
    );
  }

  parseResponse(
    apduResponse: ApduResponse,
  ): CommandResult<GetAppConfigCommandResponse, HederaErrorCodes> {
    if (!CommandUtils.isSuccessResponse(apduResponse)) {
      return hederaErrorResult(apduResponse);
    }

    const parser = new ApduParser(apduResponse);
    const storage = parser.extract8BitUInt();
    const major = parser.extract8BitUInt();
    const minor = parser.extract8BitUInt();
    const patch = parser.extract8BitUInt();

    if (
      storage === undefined ||
      major === undefined ||
      minor === undefined ||
      patch === undefined
    ) {
      return CommandResultFactory({
        error: new InvalidStatusWordError("Cannot extract app configuration"),
      });
    }

    return CommandResultFactory({
      data: { storageAllowed: storage !== 0, version: `${major}.${minor}.${patch}` },
    });
  }
}
