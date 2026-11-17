import type { ComponentType } from "react";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountReceive, ReceiveVerification } from "@domain/entity-account-receive";
import type { AccountStatus } from "@domain/entity-account-status";
import type { CryptoOrTokenCurrency, CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import type { PartialFeatures } from "@shared/feature-flags";
import type { DeviceShownVerification } from "./logic/canVerifyOnDevice";

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
  /** The account's `accountStatus` data, absent until it is read. */
  accountStatus?: AccountStatus;
  legacyAccount?: A;
}>;

/** The receive slot a coin family implements in each app: only what differs from the defaults. */
export type GetReceiveFamilyConfig<A = unknown> = (
  input: ReceiveFamilyConfigInput<A>,
) => Partial<ReceiveFamilyConfig>;

/**
 * The account's coin family slot, as the app resolves it for the address screen: the app adds the
 * feature flags and, where a family still needs it, the legacy account.
 */
export type ReceiveFamilyConfigPort = (
  input: Omit<ReceiveFamilyConfigInput, "featureFlags" | "legacyAccount">,
) => Partial<ReceiveFamilyConfig>;

/** An open incident on status.ledger.com about the network the user receives on. */
export type ReceiveServiceIncident = Readonly<{
  title: string;
  description?: string;
}>;

/** The account and the asset a receive flow shows the address of. */
export type ReceiveTarget = Readonly<{
  accountUUID: AccountUUID;
  descriptor: AccountDescriptor;
  assetId: CryptoOrTokenCurrencyId;
}>;

/** The address to verify: `receive.verification`, or `receive.shielded.verification`. */
export type VerifyAddressSelection = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  verification: ReceiveVerification;
}>;

/**
 * How the device verification ended. `mismatch` closes the receive flow. `failed`: it could not
 * start, or an error ended it.
 */
export type VerifyAddressOutcome =
  | "verified"
  | "cancelled"
  | "mismatch"
  | "unsupported"
  | "dismissed"
  | "failed";

/**
 * The Device Intent Executor error screen the user closed, as the apps' executor reports it:
 * `failureType` names the screen, `countsAsFailure` is `false` for an error the user can fix.
 */
export type VerifyAddressDeviceFlowFailure = Readonly<{
  failureType: string;
  countsAsFailure: boolean;
}>;

/** The asset and network the verification events are sent with. */
export type VerifyAddressTracking = Readonly<{
  asset: string;
  network: string;
}>;

/** The legacy account a verification reads: the network, and the asset it is tracked with. */
export type VerifyAddressAccount = Readonly<{ currency: { id: string; ticker: string } }>;

/** The props of the intent screens, as the Device Intent Executor passes them. */
export type VerifyAddressIntentComponentProps = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** Asking the device to show the address: only legacy code can read the options and run it. */
export type VerifyOnDevicePorts<Account, Options> = Readonly<{
  getAddressOptions: (account: Account, verification: DeviceShownVerification) => Promise<Options>;
  /** `connection.dmk` reports the first device request and rejects the next ones once cancelled. */
  getAddress: (
    connection: Pick<DeviceConnectionResult, "dmk" | "sessionId">,
    options: Options,
  ) => Promise<{ address: string }>;
}>;

/**
 * What the apps give the verification of a receive address: the legacy account and token reads,
 * the device operation, the executor's initialization input, and the intent screens.
 */
export type VerifyAddressExecutorPorts<Account, Token, Options, InitInput> = VerifyOnDevicePorts<
  Account,
  Options
> &
  Readonly<{
    getAccount: (accountUUID: AccountUUID) => Account | undefined;
    findToken: (assetId: CryptoOrTokenCurrencyId) => Promise<Token | undefined>;
    buildInitializationInput: (request: {
      account: Account;
      tokenCurrency: Token | undefined;
    }) => Promise<InitInput>;
    intentComponent: ComponentType<VerifyAddressIntentComponentProps>;
  }>;
