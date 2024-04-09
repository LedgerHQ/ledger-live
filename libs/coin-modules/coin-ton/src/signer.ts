import { Cell } from "@ton/ton";
import { TonTransport } from "@ton-community/ton-ledger";

export type TonAddress = {
  publicKey: Buffer;
  address: string;
};
export type TonSignature = Cell | undefined;
export interface TonSigner extends TonTransport {};
