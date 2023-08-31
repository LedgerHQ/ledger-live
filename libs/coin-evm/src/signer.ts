import { DomainServiceResolution } from "@ledgerhq/domain-service/types";
import { EIP712Message } from "@ledgerhq/types-live";

export type EvmAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type EvmSignature = {
  s: string;
  v: string | number;
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

// Duplicate type definition from hw-app-eth.
type LoadConfig = {
  // Backend service responsible for signed NFT APDUS
  nftExplorerBaseURL?: string | null;
  // example of payload https://cdn.live.ledger.com/plugins/ethereum/1.json
  // fetch against an api (base url is an api that hosts /plugins/ethereum/${chainId}.json )
  // set to null will disable it
  pluginBaseURL?: string | null;
  // provide manually some extra plugins to add for the resolution (e.g. for dev purpose)
  // object will be merged with the returned value of the Ledger cdn payload
  extraPlugins?: any | null;
  cryptoassetsBaseURL?: string | null;
};

export interface EvmSigner {
  setLoadConfig(loadConfig: LoadConfig): void;
  getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<EvmAddress>;
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null,
  ): Promise<EvmSignature>;
  signPersonalMessage(
    path: string,
    messageHex: string,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }>;
}
