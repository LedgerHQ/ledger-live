import { CardanoLikeNetworkParameters } from "./types";

export type CardanoAddress = {
  addressHex: string;
};
// Coming from @cardano-foundation/ledgerjs-hw-app-cardano code (type SignedTransactionData)
type BIP32Path = Array<number>;
export type Witness = {
  path: BIP32Path;
  witnessSignatureHex: string;
};
export type CardanoSignature = {
  txHashHex: string;
  witnesses: Array<Witness>;
};
// Coming from @cardano-foundation/ledgerjs-hw-app-cardano code (type ExtendedPublicKey)
export type CardanoExtendedPublicKey = {
  publicKeyHex: string;
  chainCodeHex: string;
};
export type GetAddressRequest = {
  path: string;
  stakingPathString: string;
  networkParams: CardanoLikeNetworkParameters;
  verify?: boolean;
};

export type SignerTxInput = {
  txHashHex: string;
  outputIndex: number;
  path: string | null;
};
export type SignerTxOutput = {
  amount: string;
  destination:
    | {
        isDeviceOwnedAddress: false;
        params: {
          addressHex: string;
        };
      }
    | {
        isDeviceOwnedAddress: true;
        params: {
          spendingPath: string;
          stakingPath: string;
        };
      };
  tokenBundle: Array<{
    policyIdHex: string;
    tokens: Array<{
      assetNameHex: string;
      amount: string;
    }>;
  }>;
};
export type SignerTxCertificate =
  | {
      type: "REGISTRATION" | "DEREGISTRATION";
      params: {
        stakeCredential: {
          keyPath: string;
        };
      };
    }
  | {
      type: "DELEGATION";
      params: {
        stakeCredential: {
          keyPath: string;
        };
        poolKeyHashHex: string;
      };
    };
export type SignerTxWithdrawal = {
  stakeCredential: {
    keyPath: string;
  };
  amount: string;
};
export type SignerTransaction = {
  inputs: Array<SignerTxInput>;
  outputs: Array<SignerTxOutput>;
  certificates: Array<SignerTxCertificate>;
  withdrawals: Array<SignerTxWithdrawal>;
  fee: string;
  ttl?: string;
  auxiliaryData: string | null;
};
export type CardanoSignRequest = {
  transaction: SignerTransaction;
  networkParams: CardanoLikeNetworkParameters;
};
export interface CardanoSigner {
  getAddress(addressRequest: GetAddressRequest): Promise<CardanoAddress>;
  getPublicKey(accountPath: string): Promise<CardanoExtendedPublicKey>;
  sign(signRequest: CardanoSignRequest): Promise<CardanoSignature>;
}
