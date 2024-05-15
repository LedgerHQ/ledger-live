import { SignTransaction } from "./types";

export type MinaAddress = {
  publicKey: string;
};
export type MinaSignature = Buffer | undefined;
export interface MinaSigner {
  getAddress(account: number): Promise<MinaAddress>;
  signTransaction(transaction: SignTransaction): Promise<MinaSignature>;
}
