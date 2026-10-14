export const CHAIN_INTEGRATORS = {
  figment: "Figment",
  hedera: "Hedera",
  multiversx: "MultiversX",
  solanaLabs: "Solana Labs",
  stellarDevelopmentFoundation: "Stellar Development Foundation",
  strica: "Strica",
  techiast: "Techiast",
  zondax: "Zondax",
} as const;

export type ChainIntegratorId = keyof typeof CHAIN_INTEGRATORS;

export type ChainIntegrator = (typeof CHAIN_INTEGRATORS)[ChainIntegratorId];

export const INTEGRATED_CHAIN_FAMILIES = {
  cardano: "strica",
  casper: "zondax",
  celo: "figment",
  filecoin: "zondax",
  hedera: "hedera",
  icon: "techiast",
  internet_computer: "zondax",
  mina: "zondax",
  multiversx: "multiversx",
  near: "figment",
  solana: "solanaLabs",
  stacks: "zondax",
  stellar: "stellarDevelopmentFoundation",
  sui: "figment",
  ton: "zondax",
} as const satisfies Record<string, ChainIntegratorId>;

export type IntegratedChainFamily = keyof typeof INTEGRATED_CHAIN_FAMILIES;

function isIntegratedChainFamily(family: string): family is IntegratedChainFamily {
  return Object.hasOwn(INTEGRATED_CHAIN_FAMILIES, family);
}

export function getChainIntegrator(family: string): ChainIntegrator | null {
  return isIntegratedChainFamily(family)
    ? CHAIN_INTEGRATORS[INTEGRATED_CHAIN_FAMILIES[family]]
    : null;
}
