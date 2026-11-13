import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountReceive } from "@domain/entity-account-receive";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { PartialFeatures } from "@shared/feature-flags";

export type ReceiveNoticeId =
  | "utxo"
  | "taproot"
  | "dashStaking"
  | "tronInactiveAccount"
  | "tezosDelegation"
  | "zcashPrivateNotEnabled";

/** What a coin family adds to the receive address screen, on top of the account data kinds. */
export type ReceiveFamilyConfig = Readonly<{
  /** `false` sends the account to the legacy receive flow. */
  isSupported: boolean;
  notices: readonly ReceiveNoticeId[];
  /** Device models whose app cannot verify an address of this family. */
  unsupportedDeviceModelIds?: readonly DeviceModelId[];
}>;

/**
 * What a family reads to build its config. `legacyAccount` is the legacy main account, read only
 * for what no account data kind serves yet.
 */
export type ReceiveFamilyConfigInput<A = unknown> = Readonly<{
  descriptor: AccountDescriptor;
  asset: Pick<CryptoOrTokenCurrency, "id" | "type">;
  featureFlags: PartialFeatures;
  /** The account's `receive` data, absent until it is read. */
  receive?: AccountReceive;
  legacyAccount?: A;
}>;

/** The receive slot a coin family implements in each app: only what differs from the defaults. */
export type GetReceiveFamilyConfig<A = unknown> = (
  input: ReceiveFamilyConfigInput<A>,
) => Partial<ReceiveFamilyConfig>;
