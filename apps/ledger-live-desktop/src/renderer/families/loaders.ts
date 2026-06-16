import type { LLDCoinFamily } from "./types";

export type LLDFamilyLoader = {
  family: string;
  /** Dynamic import — rspack/webpack creates a separate chunk per family */
  // oxlint-disable-next-line typescript/no-explicit-any
  importFamily: () => Promise<{ default: LLDCoinFamily<any, any, any, any> }>;
};

// Hand-maintained: one entry per coin family.
export const lldFamilyLoaders: LLDFamilyLoader[] = [
  { family: "aleo", importFamily: () => import("./aleo/index") },
  { family: "algorand", importFamily: () => import("./algorand/index") },
  { family: "aptos", importFamily: () => import("./aptos/index") },
  { family: "bitcoin", importFamily: () => import("./bitcoin/index") },
  { family: "canton", importFamily: () => import("./canton/index") },
  { family: "cardano", importFamily: () => import("./cardano/index") },
  { family: "casper", importFamily: () => import("./casper/index") },
  { family: "celo", importFamily: () => import("./celo/index") },
  { family: "concordium", importFamily: () => import("./concordium/index") },
  { family: "cosmos", importFamily: () => import("./cosmos/index") },
  { family: "evm", importFamily: () => import("./evm/index") },
  { family: "filecoin", importFamily: () => import("./filecoin/index") },
  { family: "hedera", importFamily: () => import("./hedera/index") },
  { family: "icon", importFamily: () => import("./icon/index") },
  { family: "internet_computer", importFamily: () => import("./internet_computer/index") },
  { family: "kaspa", importFamily: () => import("./kaspa/index") },
  { family: "mina", importFamily: () => import("./mina/index") },
  { family: "multiversx", importFamily: () => import("./multiversx/index") },
  { family: "near", importFamily: () => import("./near/index") },
  { family: "polkadot", importFamily: () => import("./polkadot/index") },
  { family: "solana", importFamily: () => import("./solana/index") },
  { family: "stacks", importFamily: () => import("./stacks/index") },
  { family: "stellar", importFamily: () => import("./stellar/index") },
  { family: "sui", importFamily: () => import("./sui/index") },
  { family: "tezos", importFamily: () => import("./tezos/index") },
  { family: "ton", importFamily: () => import("./ton/index") },
  { family: "tron", importFamily: () => import("./tron/index") },
  { family: "xrp", importFamily: () => import("./xrp/index") },
];
