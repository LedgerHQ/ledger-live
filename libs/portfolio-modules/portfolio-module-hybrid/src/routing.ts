import type { Network, RegistrationInput } from "@ledgerhq/portfolio-module-framework";
import type { RouteNetwork, RouteRegistration } from "./types";

export function registrationNetwork(registration: RegistrationInput): Network {
  switch (registration.type) {
    case "evm":
      return "ethereum";
    case "solana":
      return "solana";
    default:
      return registration.network;
  }
}

export const preferRemote: RouteNetwork = (network, networks) =>
  networks.remote.includes(network) ? "remote" : "local";

export const preferLocal: RouteNetwork = (network, networks) =>
  networks.local.includes(network) ? "local" : "remote";

export const defaultRouteRegistration: RouteRegistration = (registration, networks) =>
  preferRemote(registrationNetwork(registration), networks);

export const defaultRouteRead: RouteNetwork = preferRemote;

export const defaultRouteWrite: RouteNetwork = preferLocal;
