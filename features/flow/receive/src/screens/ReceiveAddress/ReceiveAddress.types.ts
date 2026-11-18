import type { ComponentType } from "react";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import type { ReceiveFamilyConfigPort, ReceiveServiceIncident } from "../../types";

export type ReceiveAddressProps = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  onClose: () => void;
  /** The entry point the user came from, sent with every event of the screen. */
  source?: string;
  /** Copies the address; resolves `false` when the clipboard refused it. Without it, no Copy. */
  onCopyAddress?: (address: string) => Promise<boolean>;
  /** Opens the system share sheet with the address. Without it, no Share. */
  onShareAddress?: (address: string) => void;
  /** The app's device verification, mounted while one runs. Without it, no Verify. */
  VerifyAddressExecutor?: ComponentType<UseVerifyAddressExecutorViewModelParams>;
  /** What the account's coin family adds: notices and the device models that cannot verify. */
  getFamilyConfig?: ReceiveFamilyConfigPort;
  /** Open incidents about the network received on, as status.ledger.com reports them. */
  serviceIncidents?: readonly ReceiveServiceIncident[];
  /**
   * Whether the address is on the sanctions list: the screen never shows a listed address. Without
   * it, no check.
   */
  checkAddressSanctioned?: (address: string) => Promise<boolean>;
  /**
   * Hands the account over to the legacy receive flow, which still onboards accounts and
   * activates tokens. Without it, those states offer no way forward.
   */
  onUseLegacyFlow?: () => void;
  /** Opens a support link outside the app. Without it, no Learn more. */
  onOpenUrl?: (url: string) => void;
}>;
