import { Keyring } from "./Keyring";
import { EIP712Message } from "@ledgerhq/types-live";
import { SupportedTransaction } from "./model/Transaction";

export type EcdsaSignature = { r: `0x${string}`; s: `0x${string}`; v: number };

export type EIP712Params = { domainSeparator: `0x${string}`; hashStruct: `0x${string}` };

export type SignTransactionOptions = { domain?: string };

export type SignMessageMethod = "personalSign" | "eip712" | "eip712Hashed";
export type SignMessageOptions<Method extends SignMessageMethod> = { method: Method };
export type SignMessageType<Method extends SignMessageMethod> = Method extends "personalSign"
  ? string
  : Method extends "eip712"
    ? EIP712Message
    : EIP712Params;

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
    transaction: SupportedTransaction,
    options?: SignTransactionOptions,
  ): Promise<EcdsaSignature>;

  signMessage<Method extends SignMessageMethod>(
    derivationPath: string,
    message: SignMessageType<Method>,
    options: SignMessageOptions<Method>,
  ): Promise<EcdsaSignature>;
}
