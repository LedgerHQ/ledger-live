import { ethers } from "ethers";
import AppBinding from "@ledgerhq/hw-app-eth";
import {
  EcdsaSignature,
  KeyringEth,
  GetAddressOptions,
  SignMessageOptions,
  SignTransactionOptions,
  GetAddressResult,
  SignMessageMethod,
  SignMessageType,
} from "./KeyringEth";
import { ClearSignContext, TransactionContext } from "@ledgerhq/context-module";
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";
import { TxMapper } from "./mapper/TxMapper";
import { SupportedTransaction } from "./model/Transaction";

export class DefaultKeyringEth implements KeyringEth {
  private _appBinding: AppBinding;
  private _contextModule: ContextModule;
  private _TxMapper: TxMapper;

  constructor(appBinding: AppBinding, contextModule: ContextModule) {
    this._appBinding = appBinding;
    this._contextModule = contextModule;
    this._TxMapper = new TxMapper();
  }

  public async signTransaction(
    derivationPath: string,
    transaction: SupportedTransaction,
    options?: SignTransactionOptions,
  ) {
    const challenge = await this._appBinding.getChallenge();
    const { transactionSubset, transactionRaw } = this._TxMapper.mapTransaction(transaction);
    const transactionContext: TransactionContext = { ...transactionSubset, ...options, challenge };

    const contexts: ClearSignContext[] = await this._contextModule.getContexts(transactionContext);

    for (const context of contexts) {
      if (context.type === "error") {
        // TODO: handle error here
        continue;
      }

      await this._appBinding[context.type](context.payload);
    }

    const response = await this._appBinding.signTransaction(
      derivationPath,
      transactionRaw,
      null, // context is already fetched by context-module
    );

    return {
      r: `0x${response.r}`,
      s: `0x${response.s}`,
      v: parseInt(response.v, 16),
    } as EcdsaSignature;
  }

  public async signMessage<Method extends SignMessageMethod>(
    derivationPath: string,
    message: SignMessageType<Method>,
    options: SignMessageOptions<Method>,
  ) {
    if (options.method === "personalSign") {
      const personnalMessage = message as SignMessageType<"personalSign">;
      const result = await this._appBinding.signPersonalMessage(
        derivationPath,
        Buffer.from(personnalMessage).toString("hex"),
      );

      return result as EcdsaSignature;
    }

    if (options.method === "eip712") {
      const eip712Message = message as SignMessageType<"eip712">;
      try {
        const result = await this._appBinding.signEIP712Message(derivationPath, eip712Message);
        return result as EcdsaSignature;
      } catch (e) {
        // in the case of nano S that return an INS_NOT_SUPPORTED error,
        // we fallback to eip712Hashed, as the app does not support eip712 but only eip712Hashed
        // for other errors, we rethrow it
        const isInstructionNotSupportedError =
          e instanceof Error && "statusText" in e && e.statusText === "INS_NOT_SUPPORTED";

        if (!isInstructionNotSupportedError) {
          throw e;
        }

        const { EIP712Domain, ...otherTypes } = eip712Message.types;
        const domainSeparator = ethers.utils._TypedDataEncoder.hashDomain(eip712Message.domain);
        const hashStruct = ethers.utils._TypedDataEncoder.hashStruct(
          eip712Message.primaryType,
          otherTypes,
          eip712Message.message,
        );

        const result = await this._appBinding.signEIP712HashedMessage(
          derivationPath,
          domainSeparator.slice(2), // buffer string without 0x
          hashStruct.slice(2), // buffer string without 0x
        );
        return result as EcdsaSignature;
      }
    }

    const eip712HashedMessage = message as SignMessageType<"eip712Hashed">;

    const result = await this._appBinding.signEIP712HashedMessage(
      derivationPath,
      eip712HashedMessage.domainSeparator.slice(2), // buffer string without 0x
      eip712HashedMessage.hashStruct.slice(2), // buffer string without 0x
    );
    return result as EcdsaSignature;
  }

  public async getAddress(
    derivationPath: string,
    options?: GetAddressOptions,
  ): Promise<GetAddressResult> {
    const { address, publicKey } = await this._appBinding.getAddress(
      derivationPath,
      options?.displayOnDevice,
      undefined,
      options?.chainId,
    );

    if (typeof address !== "string" || !address.startsWith("0x") || typeof publicKey !== "string") {
      throw new Error("[DefaultKeyringEth] getAddress: Invalid address or public key");
    }

    const result: GetAddressResult = {
      address: address as `0x${string}`,
      publicKey,
    };

    return result;
  }
}
