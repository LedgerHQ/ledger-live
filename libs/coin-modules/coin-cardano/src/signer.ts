import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import { Transaction as TyphonTransaction } from "@stricahq/typhonjs";
import { CardanoLikeNetworkParameters } from "./types";

export type CardanoAddress = {
  address: string;
  publicKey: string;
};
export type CardanoSignature = {
  hash: string;
  payload: string;
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
export type CardanoSignRequest = {
  unsignedTransaction: TyphonTransaction;
  accountPubKey: Bip32PublicKey;
  accountIndex: number;
  networkParams: CardanoLikeNetworkParameters;
};
export interface CardanoSigner {
  getAddress(addressRequest: GetAddressRequest): Promise<CardanoAddress>;
  getPublicKey(accountPath: string): Promise<CardanoExtendedPublicKey>;
  sign(signRequest: CardanoSignRequest): Promise<CardanoSignature>;
}
