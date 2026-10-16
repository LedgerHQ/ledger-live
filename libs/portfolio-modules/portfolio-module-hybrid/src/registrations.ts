import type { Registration } from "@ledgerhq/portfolio-module-framework";
import type { Modes } from "./modes";
import { registrationNetwork } from "./routing";

const sortedSet = (values: readonly string[] = []): string[] => [...new Set(values)].sort();

function keyMaterial(registration: Registration): unknown {
  switch (registration.type) {
    case "auto_derive":
      return registration.xpub;
    case "evm":
    case "solana":
      return registration.address;
    case "static":
      return sortedSet(registration.addresses);
    case "cardano":
      return [
        sortedSet(registration.external),
        sortedSet(registration.internal),
        sortedSet(registration.stake),
      ];
  }
}

/** What a registration registers, whatever id its side gave it. */
export const registrationIdentity = (registration: Registration): string =>
  JSON.stringify([registration.type, registrationNetwork(registration), keyMaterial(registration)]);

type TwinSearch = {
  /** The remote registrations being removed. */
  removed: readonly Registration[];
  /** The remote registrations staying: a twin registering what one of them does still backs it. */
  kept: readonly Registration[];
  /** The registrations of the local side. */
  local: readonly Registration[];
};

/** The local twins of the `removed` registrations of hybrid networks that no `kept` one backs. */
export async function hybridTwins(
  { removed, kept, local }: TwinSearch,
  modes: Modes,
): Promise<Registration[]> {
  const removedModes = await Promise.all(
    removed.map(registration => modes(registrationNetwork(registration))),
  );
  const backed = new Set(kept.map(registrationIdentity));
  const twinned = new Set(
    removed
      .filter((_, index) => removedModes[index] === "hybrid")
      .map(registrationIdentity)
      .filter(identity => !backed.has(identity)),
  );
  return local.filter(registration => twinned.has(registrationIdentity(registration)));
}
