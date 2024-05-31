import { Transaction, ethers } from "ethers";
import AppBinding from "@ledgerhq/hw-app-eth";
import {
  EcdsaSignature,
  KeyringEth,
  GetAddressOptions,
  SignMessageOptions,
  SignMessagePayload,
  SignTransactionOptions,
  GetAddressResult,
  EIP712Params,
} from "./KeyringEth";
import { ContextResponse } from "@ledgerhq/context-module";
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";
import { EIP712Message } from "@ledgerhq/types-live";

export class DefaultKeyringEth implements KeyringEth {
  private _appBinding: AppBinding;
  private _contextModule: ContextModule;

  constructor(appBinding: AppBinding, contextModule: ContextModule) {
    this._appBinding = appBinding;
    this._contextModule = contextModule;
  }

  public async signTransaction(
    derivationPath: string,
    transaction: Transaction,
    options: SignTransactionOptions,
  ) {
    const challenge = await this._appBinding.getChallenge();

    const contexts: ContextResponse[] = await this._contextModule.getContexts(transaction, {
      challenge,
      options,
    });

    for (const context of contexts) {
      if (context.type === "error") {
        // TODO: handle error here
        continue;
      }

      await this._appBinding[context.type](context.payload);
    }

    const serializedTransaction = ethers.utils.serializeTransaction(transaction);
    const response = await this._appBinding.signTransaction(
      derivationPath,
      serializedTransaction.slice(2),
      null, // context is already fetched by context-module
    );

    return {
      r: `0x${response.r}`,
      s: `0x${response.s}`,
      v: parseInt(response.v, 16),
    } as EcdsaSignature;
  }

  public async signMessage(
    derivationPath: string,
    message: SignMessagePayload,
    options: SignMessageOptions,
  ) {
    if (options.method === "personalSign") {
      if (typeof message !== "string") {
        throw new Error(
          "[DefaultKeyringEth] signMessage: personalSign requires a string type for the message parameter",
        );
      }

      const result = await this._appBinding.signPersonalMessage(
        derivationPath,
        Buffer.from(message).toString("hex"),
      );

      return result as EcdsaSignature;
    }

    if (options.method === "eip712") {
      if (!this.isEIP712Message(message)) {
        throw new Error(
          "[DefaultKeyringEth] signMessage: eip712 requires an EIP712Message type for the message parameter",
        );
      }

      try {
        const result = await this._appBinding.signEIP712Message(derivationPath, message);
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
          message.primaryType,
          otherTypes,
          message.message,
        );

        const result = await this._appBinding.signEIP712HashedMessage(
          derivationPath,
          domainSeparator.slice(2), // buffer string without 0x
          hashStruct.slice(2), // buffer string without 0x
        );
        return result as EcdsaSignature;
      }
    }

    if (options.method === "eip712Hashed") {
      if (!this.isEIP712Params(message)) {
        throw new Error(
          "[DefaultKeyringEth] signMessage: eip712Hashed requires an EIP712Params type for the message parameter",
        );
      }
    }

    const result = await this._appBinding.signEIP712HashedMessage(
      derivationPath,
      (message as EIP712Params).domainSeparator.slice(2), // buffer string without 0x
      (message as EIP712Params).hashStruct.slice(2), // buffer string without 0x
    );
    return result as EcdsaSignature;
  }

  public async getAddress(
    _derivationPath: string,
    _options?: GetAddressOptions,
  ): Promise<GetAddressResult> {
    // TODO: implement
    return Promise.resolve({} as GetAddressResult);
  }

  private isEIP712Params(message: unknown): message is EIP712Params {
    return (
      !!message &&
      typeof message === "object" &&
      "domainSeparator" in message &&
      "hashStruct" in message
    );
  }

  private isEIP712Message(message: unknown): message is EIP712Message {
    return (
      !!message &&
      typeof message === "object" &&
      "types" in message &&
      "primaryType" in message &&
      "domain" in message &&
      "message" in message
    );
  }
}
