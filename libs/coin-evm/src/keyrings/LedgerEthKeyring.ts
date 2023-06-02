import { ethers } from "ethers";
import Transport from "@ledgerhq/hw-transport";
import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712";
import Eth, { isEIP712Message, ledgerService } from "@ledgerhq/hw-app-eth";
import { EthKeyring, EthKeyringConfig } from "./EthKeyring";

type ClearSigningOptions = {
  erc20: boolean;
  nft: boolean;
  externalPlugins: boolean;
};

export default class LedgerEthKeyring implements EthKeyring {
  name = "LedgerEthKeyring";
  broadcaster = false;
  discoveryType = "multiple" as const;
  transport: Transport;
  derivationPath: string;
  clearSigningOptions: ClearSigningOptions;
  private _appBinding: Eth;

  constructor(
    transport: Transport,
    derivationPath: string,
    clearSigningOptions: ClearSigningOptions
  ) {
    this.transport = transport;
    this.derivationPath = derivationPath;
    this.clearSigningOptions = clearSigningOptions;

    this._appBinding = new Eth(this.transport);
  }

  setTransport(transport: Transport) {
    this.transport = transport;
    this._setAppBinding();
  }

  private _setAppBinding() {
    this._appBinding = new Eth(this.transport);
  }

  async signTransaction(
    transaction: ethers.Transaction
  ): Promise<{ r: string; s: string; v: string }> {
    const serializedTransaction =
      ethers.utils.serializeTransaction(transaction);
    const resolution = await ledgerService.resolveTransaction(
      serializedTransaction,
      this._appBinding.loadConfig,
      this.clearSigningOptions
    );

    return this._appBinding.signTransaction(
      this.derivationPath,
      serializedTransaction,
      resolution
    );
  }

  async signMessage(
    message: string | EIP712Message
  ): Promise<{ r: string; s: string; v: string }> {
    const isEIP712 = isEIP712Message(message);

    const { r, s, v } = isEIP712
      ? await this._appBinding.signEIP712Message(this.derivationPath, message)
      : await this._appBinding.signPersonalMessage(
          this.derivationPath,
          Buffer.from(message).toString("hex")
        );

    return {
      r,
      s,
      v: v.toString(),
    };
  }

  async getAddress(): Promise<{ address: string }> {
    return this._appBinding.getAddress(this.derivationPath);
  }
}

export interface LedgerEthKeyringConfig extends EthKeyringConfig {
  name: "LedgerEthKeyring";
  derivationPath: string;
  clearSigningOptions: ClearSigningOptions;
}
