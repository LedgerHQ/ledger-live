import type { AddressVersion } from "@stacks/transactions";
import { ResponseAddress } from "@zondax/ledger-stacks";

export type StacksAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type StacksSignature = string; // `0x${string}`

// import BlockstackApp from "@zondax/ledger-stacks";
// export default class StacksApp {
//   transport: Transport;
//   constructor(transport: Transport);
//   static prepareChunks(serializedPathBuffer: Buffer, message: Buffer): Buffer[];
//   signGetChunks(path: string, message: Buffer): Promise<Buffer[]>;
//   getVersion(): Promise<ResponseVersion>;
//   getAppInfo(): Promise<ResponseAppInfo>;
//   getAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
//   getIdentityPubKey(path: string): Promise<ResponseAddress>;
//   showAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
//   signSendChunk(chunkIdx: number, chunkNum: number, chunk: Buffer, ins: number): Promise<ResponseSign>;
//   sign(path: string, message: Buffer): Promise<any>;
//   sign_msg(path: string, message: string): Promise<any>;
//   sign_jwt(path: string, message: string): Promise<any>;
//   sign_structured_msg(path: string, domain: string, message: string): Promise<any>;
// }

export interface StacksSigner {
  // TODO: complete types
  showAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
  getAddressAndPubKey(path: string, version: AddressVersion): Promise<ResponseAddress>;
  sign(path: string, message: Buffer): Promise<any>;
}
