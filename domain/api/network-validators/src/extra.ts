import { NetworkValidatorsSourcesMissingError } from "./errors";
import type { NetworkValidatorsSource } from "./source";

/** This package's slice of the thunk `extraArgument`. */
export type NetworkValidatorsExtra = {
  networkValidators: { sources: readonly NetworkValidatorsSource[] };
};

/** The app's ranked sources, to spread into the thunk `extraArgument`: the first serving a network answers. */
export function networkValidatorsExtra(
  sources: readonly NetworkValidatorsSource[],
): NetworkValidatorsExtra {
  return { networkValidators: { sources } };
}

function isNetworkValidatorsExtra(extra: unknown): extra is NetworkValidatorsExtra {
  if (typeof extra !== "object" || extra === null || !("networkValidators" in extra)) return false;
  const { networkValidators } = extra;
  return (
    typeof networkValidators === "object" &&
    networkValidators !== null &&
    "sources" in networkValidators &&
    Array.isArray(networkValidators.sources)
  );
}

export function getNetworkValidatorsSources(extra: unknown): readonly NetworkValidatorsSource[] {
  if (!isNetworkValidatorsExtra(extra)) throw new NetworkValidatorsSourcesMissingError();
  return extra.networkValidators.sources;
}
