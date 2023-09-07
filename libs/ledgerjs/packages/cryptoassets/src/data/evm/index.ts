import arbitrum_tokens from "./42161/erc20.json";
import arbitrum_goerli_tokens from "./421613/erc20.json";
import astar_tokens from "./592/erc20.json";
import base_tokens from "./8453/erc20.json";
import base_goerli_tokens from "./84531/erc20.json";
import bittorrent_tokens from "./199/erc20.json";
import energy_web_tokens from "./246/erc20.json";
import ethereum_tokens from "./1/erc20.json";
import ethereum_ropsten_tokens from "./3/erc20.json";
import ethereum_goerli_tokens from "./5/erc20.json";
import optimism_tokens from "./10/erc20.json";
import cronos_tokens from "./25/erc20.json";
import bsc_tokens from "./56/erc20.json";
import base_signatures from "./8453/erc20-signatures.json";
import ethereum_signatures from "./1/erc20-signatures.json";
import ethereum_ropsten_signatures from "./3/erc20-signatures.json";
import ethereum_goerli_signatures from "./5/erc20-signatures.json";
import optimism_signatures from "./10/erc20-signatures.json";
import cronos_signatures from "./25/erc20-signatures.json";
import bsc_signatures from "./56/erc20-signatures.json";
import bittorrent_signatures from "./199/erc20-signatures.json";
import energy_web_signatures from "./246/erc20-signatures.json";
import astar_signatures from "./592/erc20-signatures.json";
import arbitrum_signatures from "./42161/erc20-signatures.json";
import base_goerli_signatures from "./84531/erc20-signatures.json";
import arbitrum_goerli_signatures from "./421613/erc20-signatures.json";

export const tokens = {
  42161: arbitrum_tokens,
  421613: arbitrum_goerli_tokens,
  592: astar_tokens,
  8453: base_tokens,
  84531: base_goerli_tokens,
  199: bittorrent_tokens,
  56: bsc_tokens,
  25: cronos_tokens,
  246: energy_web_tokens,
  1: ethereum_tokens,
  3: ethereum_ropsten_tokens,
  5: ethereum_goerli_tokens,
  10: optimism_tokens,
};

export const signatures = {
  42161: arbitrum_signatures,
  421613: arbitrum_goerli_signatures,
  592: astar_signatures,
  8453: base_signatures,
  84531: base_goerli_signatures,
  199: bittorrent_signatures,
  56: bsc_signatures,
  25: cronos_signatures,
  246: energy_web_signatures,
  1: ethereum_signatures,
  3: ethereum_ropsten_signatures,
  5: ethereum_goerli_signatures,
  10: optimism_signatures,
};

export default {
  tokens,
  signatures,
};
