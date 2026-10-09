import {
  ApduBuilder,
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

export type SignTransactionCommandArgs = {
  readonly keyIndex: number;
  readonly transactionBody: Uint8Array;
};

export type SignTransactionCommandResponse = Uint8Array;

const SIGNATURE_LENGTH = 64;

export class SignTransactionCommand implements Command<
  SignTransactionCommandResponse,
  SignTransactionCommandArgs,
  HederaErrorCodes
> {
  readonly name = "SignTransaction";

  constructor(readonly args: SignTransactionCommandArgs) {}

  getApdu(): Apdu {
    return buildApduOrThrow(
      new ApduBuilder({ cla: CLA, ins: INS.SIGN_TRANSACTION, p1: 0x00, p2: 0x00 })
        .addBufferToData(encodeKeyIndex(this.args.keyIndex))
        .addBufferToData(this.args.transactionBody),
    );
  }

  parseResponse(
    apduResponse: ApduResponse,
  ): CommandResult<SignTransactionCommandResponse, HederaErrorCodes> {
    if (!CommandUtils.isSuccessResponse(apduResponse)) {
      return hederaErrorResult(apduResponse);
    }

    if (apduResponse.data.length !== SIGNATURE_LENGTH) {
      return CommandResultFactory({
        error: new InvalidStatusWordError("Cannot extract signature"),
      });
    }

    return CommandResultFactory({ data: Uint8Array.from(apduResponse.data) });
  }
}
