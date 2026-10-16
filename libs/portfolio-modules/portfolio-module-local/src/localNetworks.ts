import {
  PortfolioApiError,
  type Network,
  type RegistrationType,
} from "@ledgerhq/portfolio-module-framework";
import type { LocalNetwork } from "./types";

const LOCALLY_MAPPED_TYPES: ReadonlySet<RegistrationType> = new Set([
  "auto_derive",
  "evm",
  "solana",
  "static",
]);

export const localNetworkOf = (
  networks: Record<Network, LocalNetwork>,
  name: Network,
): LocalNetwork | undefined => (Object.hasOwn(networks, name) ? networks[name] : undefined);

export function requireLocalNetwork(
  networks: Record<Network, LocalNetwork>,
  name: Network,
): LocalNetwork {
  const network = localNetworkOf(networks, name);
  if (!network) throw new PortfolioApiError("BAD_REQUEST", `Network ${name} is not served locally`);
  return network;
}

/** The network `name` when it serves `type` registrations locally. */
export function networkServing(
  networks: Record<Network, LocalNetwork>,
  name: Network,
  type: RegistrationType,
): LocalNetwork | undefined {
  const network = localNetworkOf(networks, name);
  const serves = LOCALLY_MAPPED_TYPES.has(type) && network?.registrationTypes.includes(type);
  return serves ? network : undefined;
}
