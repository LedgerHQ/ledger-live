import type {
  Network,
  PortfolioMode,
  Registration,
  RegistrationInput,
} from "@ledgerhq/portfolio-module-framework";
import type { Side } from "./types";

export function registrationNetwork(registration: RegistrationInput | Registration): Network {
  switch (registration.type) {
    case "evm":
      return "ethereum";
    case "solana":
      return "solana";
    default:
      return registration.network;
  }
}

const REGISTRATION_SIDES: Record<PortfolioMode, readonly Side[]> = {
  local: ["local"],
  remote: ["remote"],
  hybrid: ["local", "remote"],
};

/** Where a registration of a network in `mode` goes. */
export const registrationSides = (mode: PortfolioMode): readonly Side[] => REGISTRATION_SIDES[mode];

/** The side serving the portfolio and network reads of a network in `mode`. */
export const readSide = (mode: PortfolioMode): Side => (mode === "local" ? "local" : "remote");

/** The side estimating, encoding, combining and broadcasting for a network in `mode`. */
export const writeSide = (mode: PortfolioMode): Side => (mode === "remote" ? "remote" : "local");
