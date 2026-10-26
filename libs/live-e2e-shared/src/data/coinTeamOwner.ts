import { Team } from "../enum/Team";

// A coin's e2e tests belong to the team that owns its coin module in CODEOWNERS: BST 1, 2 and 3
// map to BST, every other module to Coin-integration. A token resolves through its chain's id.
// A module missing from libs/coin-modules is installed from LedgerHQ/coin-modules, so its owner
// comes from that repo's CODEOWNERS.
const BST_CURRENCY_IDS = new Set([
  // BST 1: @ledgerhq/blockchain-support
  "aptos",
  "kaspa",
  "mina",
  "near",
  "vechain",
  "zcash",
  // BST 2: @ledgerhq/ledger-partner-blockydevs
  "aleo",
  "algorand",
  "elrond",
  "hedera",
  "ripple",
  "stellar",
  // BST 3: @ledgerhq/ledger-partner-hoodies
  "cardano",
  "celo",
  "concordium_testnet",
  "internet_computer",
  "sui",
  "tezos",
  "ton",
]);

export function coinTeamOwner(currencyId: string): Team {
  return BST_CURRENCY_IDS.has(currencyId.split("/")[0]) ? Team.BST : Team.COIN_INTEGRATION;
}
