import type { EnergyProviderInfo } from "../types";

// Hardcoded energy-provider registry for gas sponsoring. Tronify is the only provider today; the
// registry keeps the module vendor-agnostic-ready (PRD Workstream A) and gives the front end a
// stable id -> display name so it can disclose the third party. No network fetch — a tiny static
// disclosure map, mirroring coin-solana's LEDGER_VALIDATOR_LIST.
export const TRONIFY_PROVIDER: Readonly<EnergyProviderInfo> = { id: "tronify", name: "Tronify" };

export const ENERGY_PROVIDERS: ReadonlyArray<Readonly<EnergyProviderInfo>> = [TRONIFY_PROVIDER];

// Display metadata only — not a config gate; raw-signing is gated by energyRent's getEnergyProvider(config).
export const findEnergyProvider = (id: string): EnergyProviderInfo | undefined =>
  ENERGY_PROVIDERS.find(p => p.id === id);
