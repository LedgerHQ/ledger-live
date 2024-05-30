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
} from "./KeyringEth";
import { ContextResponse } from "@ledgerhq/context-module";
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";

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
    _derivationPath: string,
    _message: SignMessagePayload,
    _options: SignMessageOptions,
  ): Promise<EcdsaSignature> {
    // TODO: implement
    return Promise.resolve({} as EcdsaSignature);
  }

  public async getAddress(
    _derivationPath: string,
    _options?: GetAddressOptions,
  ): Promise<GetAddressResult> {
    // TODO: implement
    return Promise.resolve({} as GetAddressResult);
  }
}
