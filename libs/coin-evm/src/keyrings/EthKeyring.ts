import { ethers } from "ethers";
import { Keyring } from "@ledgerhq/coin-framework/keyrings/index";
import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712";

export interface EthKeyring extends Keyring {
  broadcaster: boolean;
  discoveryType: "single" | "multiple";
  getAddress(): Promise<{ address: string }>;
  signTransaction(
    transaction: ethers.Transaction
  ): Promise<{ r: string; s: string; v: string } | string>;
  signMessage(
    message: string | EIP712Message
  ): Promise<{ r: string; s: string; v: string }>;
}
export interface EthKeyringConfig {
  name: string;
}
