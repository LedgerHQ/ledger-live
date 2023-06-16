import { DomainServiceResolution } from "@ledgerhq/domain-service/types";

export type EvmAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};
export type EvmSignature = {
  s: string;
  v: string;
  r: string;
};

// Duplicate type definition from hw-app-eth.
type LedgerEthTransactionResolution = {
  // device serialized data that contains ERC20 data (hex format)
  erc20Tokens: Array<string>;
  // device serialized data that contains NFT data (hex format)
  nfts: Array<string>;
  // device serialized data that contains external plugin data (hex format)
  externalPlugin: Array<{ payload: string; signature: string }>;
  // device serialized data that contains plugin data (hex format)
  plugin: Array<string>;
  // device serialized data that contain trusted names data (hex format)
  domains: DomainServiceResolution[];
};

export interface EvmSigner {
  getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<EvmAddress>;
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<EvmSignature>;
}
