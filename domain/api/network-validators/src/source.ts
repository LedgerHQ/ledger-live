import type { NetworkId } from "@domain/entity-account-descriptor";
import type { NetworkValidator } from "@domain/entity-network-validators";

/** A connector reading the validators of the networks it serves. */
export type NetworkValidatorsSource = {
  id: string;
  /** Pure and synchronous, decided from the network alone. */
  supports(networkId: NetworkId): boolean;
  read(networkId: NetworkId, options: { signal: AbortSignal }): Promise<NetworkValidator[]>;
};
