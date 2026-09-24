import { boolParser, stringParser } from "@ledgerhq/live-env";

const teamBlockchainSupport = {
  APTOS_ENABLE_TOKENS: {
    def: false,
    parser: boolParser,
    desc: "Enable tokens on Aptos",
  },
  APTOS_ENABLE_STAKING: {
    def: false,
    parser: boolParser,
    desc: "Enable staking for Aptos",
  },
  API_STACKS_NETWORK: {
    parser: stringParser,
    def: "mainnet",
    desc: "Stacks network for legacy-bridge address derivation (mainnet | testnet)",
  },
  API_STACKS_SKIP_FEE_ESTIMATE: {
    parser: boolParser,
    def: false,
    desc: "Coin-tester only: skip the network fee estimate and keep the transaction's own pre-set fee (devnet has no historical fee data)",
  },
  API_VECHAIN_THOREST: {
    def: "https://vechain.coin.ledger.com",
    parser: stringParser,
    desc: "Thorest API for VeChain",
  },
};

export default teamBlockchainSupport;
