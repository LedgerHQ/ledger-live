import { accountIdOf, type AccountDescriptor } from "@ledgerhq/account-module-framework";
import type {
  Network,
  Registration,
  RegistrationInput,
} from "@ledgerhq/portfolio-module-framework";
import { networkServing } from "./localNetworks";
import type { LocalNetwork, LocalPortfolioDeps, StoredAccount } from "./types";

type RegistrationDeps = Pick<LocalPortfolioDeps, "networks" | "generateId">;

const descriptorOf = (network: LocalNetwork, key: string): AccountDescriptor => ({
  currencyId: network.currencyId,
  derivationMode: network.derivationMode,
  index: 0,
  key,
  derivationPath: network.derivationPath,
});

function toRegistration(input: RegistrationInput, id: string): Registration {
  switch (input.type) {
    case "static":
    case "cardano": {
      const { accountId, ...registration } = input;
      return { ...registration, id };
    }
    default:
      return { ...input, id };
  }
}

function accountsOf(
  { networks, generateId }: RegistrationDeps,
  registrationId: string,
  input: RegistrationInput,
): StoredAccount[] {
  const served = (
    network: Network,
    descriptor: AccountDescriptor,
    id = accountIdOf(descriptor),
  ) => ({
    id,
    network,
    registrationId,
    status: "uninitialized" as const,
    descriptor,
  });
  const failed = (id: string, network: Network, error: string) => ({
    id,
    network,
    registrationId,
    status: "registration_failure" as const,
    error,
  });
  const notServed = (id: string, { type, network }: { type: string; network: Network }) =>
    failed(id, network, `${type} registrations are not served locally on ${network}`);

  switch (input.type) {
    case "auto_derive": {
      const network = networkServing(networks, input.network, input.type);
      return [
        network
          ? served(input.network, descriptorOf(network, input.xpub))
          : notServed(generateId(), input),
      ];
    }
    case "evm":
      return Object.keys(networks).flatMap(name => {
        const network = networkServing(networks, name, input.type);
        return network ? [served(name, descriptorOf(network, input.address))] : [];
      });
    case "solana": {
      const network = networkServing(networks, "solana", input.type);
      return network ? [served("solana", descriptorOf(network, input.address))] : [];
    }
    case "static": {
      const network = networkServing(networks, input.network, input.type);
      const addresses = [...new Set(input.addresses ?? [])];
      if (!network) return [notServed(input.accountId, input)];
      if (addresses.length !== 1) {
        const error = `A static account is served locally for exactly one address, not ${addresses.length}`;
        return [failed(input.accountId, input.network, error)];
      }
      return [served(input.network, descriptorOf(network, addresses[0]), input.accountId)];
    }
    case "cardano":
      return [notServed(input.accountId, input)];
  }
}

/** The registration of `input`, and the accounts it brings: one per account module account. */
export function register(
  deps: RegistrationDeps,
  input: RegistrationInput,
): { registration: Registration; accounts: StoredAccount[] } {
  const registration = toRegistration(input, deps.generateId());
  return { registration, accounts: accountsOf(deps, registration.id, input) };
}
