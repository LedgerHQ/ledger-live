import { MinaUnsignedTransaction } from "./types";

export type MinaAddress = {
  publicKey: string;
};
export type MinaSignature = { signature: string; returnCode: string };
export interface MinaSigner {
  getAddress(account: number): Promise<MinaAddress>;
  signTransaction(transaction: MinaUnsignedTransaction): Promise<MinaSignature>;
}
