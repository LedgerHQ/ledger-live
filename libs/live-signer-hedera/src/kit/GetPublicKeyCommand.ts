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
import { buildApduOrThrow, encodeKeyIndex } from "./apdu";
import { CLA, INS } from "./constants";
import { hederaErrorResult, type HederaErrorCodes } from "./HederaAppErrors";

export type GetPublicKeyCommandArgs = {
  readonly keyIndex: number;
  readonly checkOnDevice: boolean;
};

export type GetPublicKeyCommandResponse = string;

const P1_CHECK_ON_DEVICE = 0x00;
const P1_SILENT = 0x01;

const PUBLIC_KEY_LENGTH = 32;

export class GetPublicKeyCommand implements Command<
  GetPublicKeyCommandResponse,
  GetPublicKeyCommandArgs,
  HederaErrorCodes
> {
  readonly name = "GetPublicKey";

  constructor(readonly args: GetPublicKeyCommandArgs) {}

  getApdu(): Apdu {
    return buildApduOrThrow(
      new ApduBuilder({
        cla: CLA,
        ins: INS.GET_PUBLIC_KEY,
        p1: this.args.checkOnDevice ? P1_CHECK_ON_DEVICE : P1_SILENT,
        p2: 0x00,
      }).addBufferToData(encodeKeyIndex(this.args.keyIndex)),
    );
  }

  parseResponse(
    apduResponse: ApduResponse,
  ): CommandResult<GetPublicKeyCommandResponse, HederaErrorCodes> {
    if (!CommandUtils.isSuccessResponse(apduResponse)) {
      return hederaErrorResult(apduResponse);
    }

    const parser = new ApduParser(apduResponse);
    const publicKey = parser.extractFieldByLength(PUBLIC_KEY_LENGTH);

    if (publicKey === undefined) {
      return CommandResultFactory({
        error: new InvalidStatusWordError("Cannot extract public key"),
      });
    }

    return CommandResultFactory({ data: parser.encodeToHexaString(publicKey) });
  }
}
