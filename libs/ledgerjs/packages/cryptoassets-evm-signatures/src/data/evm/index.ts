import { ERC20Token } from "../../types";

import ethereum_tokens from "./1/erc20.json";
import optimism_tokens from "./10/erc20.json";
import cronos_tokens from "./25/erc20.json";
import telos_evm_tokens from "./40/erc20.json";
import bsc_tokens from "./56/erc20.json";
import syscoin_tokens from "./57/erc20.json";
import polygon_tokens from "./137/erc20.json";
import bittorrent_tokens from "./199/erc20.json";
import fantom_tokens from "./250/erc20.json";
import astar_tokens from "./592/erc20.json";
import polygon_zk_evm_tokens from "./1101/erc20.json";
import moonbeam_tokens from "./1284/erc20.json";
import base_tokens from "./8453/erc20.json";
import arbitrum_tokens from "./42161/erc20.json";
import avalanche_c_chain_tokens from "./43114/erc20.json";
import linea_tokens from "./59144/erc20.json";
import blast_tokens from "./81457/erc20.json";
import scroll_tokens from "./534352/erc20.json";
import neon_evm_tokens from "./245022934/erc20.json";

import ethereum_tokens_hash from "./1/erc20-hash.json";
import optimism_tokens_hash from "./10/erc20-hash.json";
import cronos_tokens_hash from "./25/erc20-hash.json";
import telos_evm_tokens_hash from "./40/erc20-hash.json";
import bsc_tokens_hash from "./56/erc20-hash.json";
import syscoin_tokens_hash from "./57/erc20-hash.json";
import polygon_tokens_hash from "./137/erc20-hash.json";
import bittorrent_tokens_hash from "./199/erc20-hash.json";
import fantom_tokens_hash from "./250/erc20-hash.json";
import astar_tokens_hash from "./592/erc20-hash.json";
import polygon_zk_evm_tokens_hash from "./1101/erc20-hash.json";
import moonbeam_tokens_hash from "./1284/erc20-hash.json";
import base_tokens_hash from "./8453/erc20-hash.json";
import arbitrum_tokens_hash from "./42161/erc20-hash.json";
import avalanche_c_chain_tokens_hash from "./43114/erc20-hash.json";
import linea_tokens_hash from "./59144/erc20-hash.json";
import blast_tokens_hash from "./81457/erc20-hash.json";
import scroll_tokens_hash from "./534352/erc20-hash.json";
import neon_evm_tokens_hash from "./245022934/erc20-hash.json";

import ethereum_signatures from "./1/erc20-signatures.json";
import optimism_signatures from "./10/erc20-signatures.json";
import cronos_signatures from "./25/erc20-signatures.json";
import telos_evm_signatures from "./40/erc20-signatures.json";
import bsc_signatures from "./56/erc20-signatures.json";
import syscoin_signatures from "./57/erc20-signatures.json";
import polygon_signatures from "./137/erc20-signatures.json";
import bittorrent_signatures from "./199/erc20-signatures.json";
import fantom_signatures from "./250/erc20-signatures.json";
import astar_signatures from "./592/erc20-signatures.json";
import polygon_zk_evm_signatures from "./1101/erc20-signatures.json";
import moonbeam_signatures from "./1284/erc20-signatures.json";
import base_signatures from "./8453/erc20-signatures.json";
import arbitrum_signatures from "./42161/erc20-signatures.json";
import avalanche_c_chain_signatures from "./43114/erc20-signatures.json";
import linea_signatures from "./59144/erc20-signatures.json";
import blast_signatures from "./81457/erc20-signatures.json";
import scroll_signatures from "./534352/erc20-signatures.json";
import neon_evm_signatures from "./245022934/erc20-signatures.json";

export const tokens = {
  1: ethereum_tokens as ERC20Token[],
  10: optimism_tokens as ERC20Token[],
  25: cronos_tokens as ERC20Token[],
  40: telos_evm_tokens as ERC20Token[],
  56: bsc_tokens as ERC20Token[],
  57: syscoin_tokens as ERC20Token[],
  137: polygon_tokens as ERC20Token[],
  199: bittorrent_tokens as ERC20Token[],
  250: fantom_tokens as ERC20Token[],
  592: astar_tokens as ERC20Token[],
  1101: polygon_zk_evm_tokens as ERC20Token[],
  1284: moonbeam_tokens as ERC20Token[],
  8453: base_tokens as ERC20Token[],
  42161: arbitrum_tokens as ERC20Token[],
  43114: avalanche_c_chain_tokens as ERC20Token[],
  59144: linea_tokens as ERC20Token[],
  81457: blast_tokens as ERC20Token[],
  534352: scroll_tokens as ERC20Token[],
  245022934: neon_evm_tokens as ERC20Token[],
};

export const signatures = {
  1: ethereum_signatures,
  10: optimism_signatures,
  25: cronos_signatures,
  40: telos_evm_signatures,
  56: bsc_signatures,
  57: syscoin_signatures,
  137: polygon_signatures,
  199: bittorrent_signatures,
  250: fantom_signatures,
  592: astar_signatures,
  1101: polygon_zk_evm_signatures,
  1284: moonbeam_signatures,
  8453: base_signatures,
  42161: arbitrum_signatures,
  43114: avalanche_c_chain_signatures,
  59144: linea_signatures,
  81457: blast_signatures,
  534352: scroll_signatures,
  245022934: neon_evm_signatures,
};

export const hashes = {
  1: ethereum_tokens_hash,
  10: optimism_tokens_hash,
  25: cronos_tokens_hash,
  40: telos_evm_tokens_hash,
  56: bsc_tokens_hash,
  57: syscoin_tokens_hash,
  137: polygon_tokens_hash,
  199: bittorrent_tokens_hash,
  250: fantom_tokens_hash,
  592: astar_tokens_hash,
  1101: polygon_zk_evm_tokens_hash,
  1284: moonbeam_tokens_hash,
  8453: base_tokens_hash,
  42161: arbitrum_tokens_hash,
  43114: avalanche_c_chain_tokens_hash,
  59144: linea_tokens_hash,
  81457: blast_tokens_hash,
  534352: scroll_tokens_hash,
  245022934: neon_evm_tokens_hash,
};

export default {
  tokens,
  signatures,
  hashes,
};
