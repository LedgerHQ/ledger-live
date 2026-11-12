import type { AccountReceive } from "@domain/entity-account-receive";
import type { Account } from "@ledgerhq/types-live";
import type { Features } from "@shared/feature-flags";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  resolveReceiveFamilyConfig,
  resolveReceiveFamilyTraits,
  type ReceiveFamilyConfig,
  type ReceiveFamilyTraits,
  type ReceiveGate,
} from "@features/flow-receive";
import perFamily from "~/generated/ReceiveAddressConfig";

export type ReceiveAddressConfigInput = Readonly<{
  descriptor: AccountDescriptor;
  /** What the user receives: the account's coin, or a token. */
  asset: CryptoOrTokenCurrency;
  featureFlags: Features;
  /** Legacy account state no entity holds yet (operation count, delegation). */
  legacyAccount?: Account;
}>;

type FamilyReceiveAddressConfig = (
  input: ReceiveAddressConfigInput,
) => Partial<ReceiveFamilyTraits>;

const byFamily: Readonly<Record<string, FamilyReceiveAddressConfig | undefined>> = perFamily;

type Params = ReceiveAddressConfigInput &
  Readonly<{ family: string; excludedFamilies?: readonly string[] }>;

/** What the family adds to the receive screen, before its `receive` account data is known. */
export function getReceiveFamilyTraits({
  family,
  excludedFamilies,
  ...input
}: Params): ReceiveFamilyTraits {
  return resolveReceiveFamilyTraits({
    family,
    familyConfig: byFamily[family]?.(input),
    excludedFamilies,
  });
}

/** The family traits merged with the account's `receive` data and receive gate, absent while read. */
export function getReceiveFamilyConfig({
  family,
  excludedFamilies,
  receive,
  gate,
  ...input
}: Params &
  Readonly<{ receive?: AccountReceive; gate?: ReceiveGate | null }>): ReceiveFamilyConfig {
  return resolveReceiveFamilyConfig({
    family,
    familyConfig: byFamily[family]?.(input),
    excludedFamilies,
    receive,
    gate,
  });
}
