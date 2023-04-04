import { DomainServiceResolution as DomainDescriptor } from "@ledgerhq/domain-service/types";
import {
  signAddressResolution,
  signDomainResolution,
} from "@ledgerhq/domain-service/signers/index";

export type LedgerEthTransactionResolution = {
  // device serialized data that contains ERC20 data (hex format)
  erc20Tokens: Array<string>;
  // device serialized data that contains NFT data (hex format)
  nfts: Array<string>;
  // device serialized data that contains external plugin data (hex format)
  externalPlugin: Array<{ payload: string; signature: string }>;
  // device serialized data that contains plugin data (hex format)
  plugin: Array<string>;
  // device serialized data that contain trusted names data (hex format)
  domains: DomainDescriptor[];
};

export type LoadConfig = {
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

/**
 * Allows to configure precisely what the service need to resolve.
 * for instance you can set nft:true if you need clear signing on NFTs. If you set it and it is not a NFT transaction, it should still work but will do a useless service resolution.
 */
export type ResolutionConfig = {
  // NFT resolution service
  nft?: boolean;
  // external plugins resolution service (e.G. LIDO)
  externalPlugins?: boolean;
  // ERC20 resolution service (to clear sign erc20 transfers & other actions)
  erc20?: boolean;
  // List of trusted names (ENS for now) to clear sign
  domains?: DomainDescriptor[];
};

export type LedgerEthTransactionService = {
  resolveTransaction: (
    rawTxHex: string,
    loadConfig: LoadConfig,
    resolutionConfig: ResolutionConfig
  ) => Promise<LedgerEthTransactionResolution>;
  signDomainResolution: typeof signDomainResolution;
  signAddressResolution: typeof signAddressResolution;
};
