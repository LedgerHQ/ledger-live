export type BoilerplateAddress = {
  publicKey: string;
  address: string;
};

export type BoilerplateSignature = string; // `0x${string}`

export interface BoilerplateSigner {
  getAddress(path: string): Promise<BoilerplateAddress>;
  signTransaction(path: string, rawTx: string): Promise<BoilerplateSignature>;
}
