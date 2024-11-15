import type { AddressVersion } from "@stacks/transactions";
import { ResponseAddress } from "@zondax/ledger-stacks";

export type StacksAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type StacksSignature = string; // `0x${string}`

export interface StacksSigner {
  showAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
  getAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
  sign(path: string, message: Buffer): Promise<any>;
}
