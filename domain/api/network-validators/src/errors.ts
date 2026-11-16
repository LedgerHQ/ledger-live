import type { NetworkId } from "@domain/entity-account-descriptor";

export class NoNetworkValidatorsSourceError extends Error {
  override name = "NoNetworkValidatorsSourceError";
  readonly networkId: NetworkId;
  constructor(networkId: NetworkId) {
    super(`No network validators source serves ${networkId}`);
    this.networkId = networkId;
  }
}

export class NetworkValidatorsSourcesMissingError extends Error {
  override name = "NetworkValidatorsSourcesMissingError";
  constructor() {
    super("The store's thunk extraArgument has no networkValidatorsExtra(sources)");
  }
}
