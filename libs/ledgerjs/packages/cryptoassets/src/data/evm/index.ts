import arbitrum_tokens from "./42161/erc20.json";
import bsc_tokens from "./56/erc20.json";
import cronos_tokens from "./25/erc20.json";
import ethereum_tokens from "./1/erc20.json";
import ethereum_goerli_tokens from "./5/erc20.json";
import ethereum_rinkeby_tokens from "./4/erc20.json";
import ethereum_ropsten_tokens from "./3/erc20.json";
import ethereum_sepolia_tokens from "./11155111/erc20.json";
import fantom_tokens from "./250/erc20.json";
import flare_tokens from "./14/erc20.json";
import moonbeam_tokens from "./1284/erc20.json";
import optimism_tokens from "./10/erc20.json";
import polygon_tokens from "./137/erc20.json";
import songbird_tokens from "./19/erc20.json";
import arbitrum_signatures from "./42161/erc20-signatures.json";
import bsc_signatures from "./56/erc20-signatures.json";
import cronos_signatures from "./25/erc20-signatures.json";
import ethereum_signatures from "./1/erc20-signatures.json";
import ethereum_goerli_signatures from "./5/erc20-signatures.json";
import ethereum_rinkeby_signatures from "./4/erc20-signatures.json";
import ethereum_ropsten_signatures from "./3/erc20-signatures.json";
import ethereum_sepolia_signatures from "./11155111/erc20-signatures.json";
import fantom_signatures from "./250/erc20-signatures.json";
import flare_signatures from "./14/erc20-signatures.json";
import moonbeam_signatures from "./1284/erc20-signatures.json";
import optimism_signatures from "./10/erc20-signatures.json";
import polygon_signatures from "./137/erc20-signatures.json";
import songbird_signatures from "./19/erc20-signatures.json";

export const tokens = {
  42161: arbitrum_tokens,
  56: bsc_tokens,
  25: cronos_tokens,
  1: ethereum_tokens,
  5: ethereum_goerli_tokens,
  4: ethereum_rinkeby_tokens,
  3: ethereum_ropsten_tokens,
  11155111: ethereum_sepolia_tokens,
  250: fantom_tokens,
  14: flare_tokens,
  1284: moonbeam_tokens,
  10: optimism_tokens,
  137: polygon_tokens,
  19: songbird_tokens,
};

export const signatures = {
  42161: arbitrum_signatures,
  56: bsc_signatures,
  25: cronos_signatures,
  1: ethereum_signatures,
  5: ethereum_goerli_signatures,
  4: ethereum_rinkeby_signatures,
  3: ethereum_ropsten_signatures,
  11155111: ethereum_sepolia_signatures,
  250: fantom_signatures,
  14: flare_signatures,
  1284: moonbeam_signatures,
  10: optimism_signatures,
  137: polygon_signatures,
  19: songbird_signatures,
};

export default {
  tokens,
  signatures,
};
