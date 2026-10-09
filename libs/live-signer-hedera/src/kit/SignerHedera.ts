import {
  SendCommandInAppDeviceAction,
  UserInteractionRequired,
  type CommandErrorResult,
  type DeviceManagementKit,
  type DeviceSessionId,
  type ExecuteDeviceActionReturnType,
  type OpenAppDAError,
  type SendCommandInAppDAIntermediateValue,
  type SendCommandInAppDAOutput,
} from "@ledgerhq/device-management-kit";
import { APP_NAME, MAX_TRANSACTION_SIZE } from "./constants";
import { GetAppConfigCommand, type GetAppConfigCommandResponse } from "./GetAppConfigCommand";
import { GetPublicKeyCommand, type GetPublicKeyCommandResponse } from "./GetPublicKeyCommand";
import type { HederaErrorCodes } from "./HederaAppErrors";
import {
  SignTransactionCommand,
  type SignTransactionCommandResponse,
} from "./SignTransactionCommand";

export type HederaDAError = OpenAppDAError | CommandErrorResult<HederaErrorCodes>["error"];

type HederaDAReturnType<
  Output,
  Interaction extends UserInteractionRequired,
> = ExecuteDeviceActionReturnType<
  SendCommandInAppDAOutput<Output>,
  HederaDAError,
  SendCommandInAppDAIntermediateValue<Interaction>
>;

export type GetAppConfigDAReturnType = HederaDAReturnType<
  GetAppConfigCommandResponse,
  UserInteractionRequired.None
>;

export type GetPublicKeyDAReturnType = HederaDAReturnType<
  GetPublicKeyCommandResponse,
  UserInteractionRequired.None | UserInteractionRequired.VerifyAddress
>;

export type SignTransactionDAReturnType = HederaDAReturnType<
  SignTransactionCommandResponse,
  UserInteractionRequired.SignTransaction
>;

export type CommonOptions = {
  skipOpenApp?: boolean;
};

export type PublicKeyOptions = CommonOptions & {
  checkOnDevice?: boolean;
};

export interface SignerHedera {
  getAppConfig(options?: CommonOptions): GetAppConfigDAReturnType;
  getPublicKey(keyIndex: number, options?: PublicKeyOptions): GetPublicKeyDAReturnType;
  signTransaction(
    keyIndex: number,
    transactionBody: Uint8Array,
    options?: CommonOptions,
  ): SignTransactionDAReturnType;
}

class DefaultSignerHedera implements SignerHedera {
  constructor(
    private readonly dmk: DeviceManagementKit,
    private readonly sessionId: DeviceSessionId,
  ) {}

  getAppConfig({ skipOpenApp = false }: CommonOptions = {}): GetAppConfigDAReturnType {
    return this.dmk.executeDeviceAction({
      sessionId: this.sessionId,
      deviceAction: new SendCommandInAppDeviceAction({
        input: {
          command: new GetAppConfigCommand(),
          appName: APP_NAME,
          requiredUserInteraction: UserInteractionRequired.None,
          skipOpenApp,
        },
      }),
    });
  }

  getPublicKey(
    keyIndex: number,
    { checkOnDevice = false, skipOpenApp = false }: PublicKeyOptions = {},
  ): GetPublicKeyDAReturnType {
    return this.dmk.executeDeviceAction({
      sessionId: this.sessionId,
      deviceAction: new SendCommandInAppDeviceAction({
        input: {
          command: new GetPublicKeyCommand({ keyIndex, checkOnDevice }),
          appName: APP_NAME,
          requiredUserInteraction: checkOnDevice
            ? UserInteractionRequired.VerifyAddress
            : UserInteractionRequired.None,
          skipOpenApp,
        },
      }),
    });
  }

  signTransaction(
    keyIndex: number,
    transactionBody: Uint8Array,
    { skipOpenApp = false }: CommonOptions = {},
  ): SignTransactionDAReturnType {
    if (transactionBody.length > MAX_TRANSACTION_SIZE) {
      throw new Error(
        `Hedera transaction is ${transactionBody.length} bytes, the device accepts at most ${MAX_TRANSACTION_SIZE}`,
      );
    }
    return this.dmk.executeDeviceAction({
      sessionId: this.sessionId,
      deviceAction: new SendCommandInAppDeviceAction({
        input: {
          command: new SignTransactionCommand({ keyIndex, transactionBody }),
          appName: APP_NAME,
          requiredUserInteraction: UserInteractionRequired.SignTransaction,
          skipOpenApp,
        },
      }),
    });
  }
}

export class SignerHederaBuilder {
  private readonly dmk: DeviceManagementKit;
  private readonly sessionId: DeviceSessionId;

  constructor({ dmk, sessionId }: { dmk: DeviceManagementKit; sessionId: DeviceSessionId }) {
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  build(): SignerHedera {
    return new DefaultSignerHedera(this.dmk, this.sessionId);
  }
}
