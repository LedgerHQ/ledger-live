export type CantonAddress = {
  publicKey: string;
  address: string;
  path: string;
};

export type CantonSignature = string;

export interface CantonPreparedTransaction {
  damlTransaction: Uint8Array;
  nodes: Uint8Array[];
  metadata: Uint8Array;
  inputContracts: Uint8Array[];
}

export interface CantonUntypedVersionedMessage {
  transactions: string[];
}

export interface CantonSigner {
  getAddress(path: string, display?: boolean): Promise<CantonAddress>;
  signTransaction(
    path: string,
    data: CantonPreparedTransaction | CantonUntypedVersionedMessage | string,
  ): Promise<CantonSignature>;
}
