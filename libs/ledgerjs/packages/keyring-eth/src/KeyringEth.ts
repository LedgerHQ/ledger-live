import { Transaction } from "ethers";
import { Keyring } from "./Keyring";
import { LoaderOptions } from "@ledgerhq/context-module/src/shared/model/LoaderOptions";
import { EIP712Message } from "@ledgerhq/types-live";

export type EcdsaSignature = { r: `0x${string}`; s: `0x${string}`; v: number };

export type EIP712Params = { domainSeparator: `0x${string}`; hashStruct: `0x${string}` };

export type SignTransactionOptions = LoaderOptions["options"];

export type SignMessagePayload = string | EIP712Message | EIP712Params;

// TODO: reinforce the type of the options
export type SignMessageOptions = { method: "personalSign" | "eip712" | "eip712Hashed" };

export type GetAddressResult = {
  publicKey: string;
  address: `0x${string}`;
};

export type GetAddressOptions = {
  displayOnDevice?: boolean;
  chainId?: string;
};

export interface KeyringEth extends Keyring {
  getAddress(derivationPath: string, options?: GetAddressOptions): Promise<GetAddressResult>;

  signTransaction(
    derivationPath: string,
    transaction: Transaction,
    options: SignTransactionOptions,
  ): Promise<EcdsaSignature>;

  signMessage(
    derivationPath: string,
    message: SignMessagePayload,
    options: SignMessageOptions,
  ): Promise<EcdsaSignature>;
}
