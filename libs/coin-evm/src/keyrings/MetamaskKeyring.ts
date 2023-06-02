import { ethers } from "ethers";
import { EthKeyring, EthKeyringConfig } from "./EthKeyring";
import { MetaMaskConnector } from "mm-app-eth";
import {
  EIP712Message,
  isEIP712Message,
} from "@ledgerhq/hw-app-eth/lib/modules/EIP712";

export default class MetaMaskKeyring implements EthKeyring {
  name = "MetamaskKeyring";
  broadcaster = true;
  discoveryType = "single" as const;
  private _connector: MetaMaskConnector;
  private _provider?: ethers.providers.Web3Provider;

  constructor(connectorPort = 3333) {
    this._connector = new MetaMaskConnector({
      port: connectorPort,
    });
  }

  setConnector(connectorPort: number): void {
    this._connector = new MetaMaskConnector({
      port: connectorPort,
    });
  }

  private async _setProvider(): Promise<void> {
    if (this._provider) return;

    await this._connector.start();
    this._provider = this._connector.getProvider();
  }

  async signTransaction(transaction: ethers.Transaction): Promise<string> {
    await this._setProvider();
    if (!this._provider) throw new Error();

    const [txHash] = await this._provider.send("eth_sendTransaction", [
      transaction,
    ]);

    return txHash;
  }

  async signMessage(
    message: string | EIP712Message
  ): Promise<{ r: string; s: string; v: string }> {
    await this._setProvider();
    if (!this._provider) throw new Error();

    const address = await this.getAddress();
    const signature = isEIP712Message(message)
      ? await this._provider.send("eth_signTypedData_v4", [address, message])
      : await this._provider.send("personal_sign", [
          address,
          `0x${Buffer.from(message).toString("hex")}`,
        ]);

    const { r, s, v } = ethers.utils.splitSignature(signature);

    return {
      r,
      s,
      v: v.toString(),
    };
  }

  async getAddress(): Promise<{ address: string }> {
    await this._setProvider();
    if (!this._provider) throw new Error();

    const [address] = await this._provider.send("eth_requestAccounts", []);
    return address;
  }
}

export interface MetaMaskKeyringConfig extends EthKeyringConfig {
  name: "MetaMaskKeyring";
  connectorPort: number;
}
