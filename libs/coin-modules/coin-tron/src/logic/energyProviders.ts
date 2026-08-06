import type { EnergyProvider } from "../types";

// Hardcoded energy-provider registry for gas sponsoring. Tronify is the only provider today; the
// registry keeps the module vendor-agnostic-ready (PRD Workstream A) and gives the front end a
// stable id -> display name so it can disclose the third party. No network fetch — a tiny static
// disclosure map, mirroring coin-solana's LEDGER_VALIDATOR_LIST.
export const TRONIFY_PROVIDER: EnergyProvider = { id: "tronify", name: "Tronify" };

export const ENERGY_PROVIDERS: EnergyProvider[] = [TRONIFY_PROVIDER];

export const getEnergyProvider = (id: string): EnergyProvider | undefined =>
  ENERGY_PROVIDERS.find(p => p.id === id);
