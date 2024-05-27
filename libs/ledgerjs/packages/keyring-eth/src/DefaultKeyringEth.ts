import { Transaction } from "ethers";
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
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";

export class DefaultKeyringEth implements KeyringEth {
  private _appBinding: AppBinding;
  private _contextModule: ContextModule;

  constructor(appBinding: AppBinding, contextModule: ContextModule) {
    this._appBinding = appBinding;
    this._contextModule = contextModule;
  }

  public async signTransaction(
    _derivationPath: string,
    _transaction: Transaction,
    _options: SignTransactionOptions,
  ) {
    // TODO: implement
    return Promise.resolve({} as EcdsaSignature);
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
