import type { ComponentType, RefObject } from "react";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import type { ReceiveFamilyConfigPort } from "../../types";

export type ReceiveAddressProps = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  onClose: () => void;
  /** Copies the address; resolves `false` when the clipboard refused it. Without it, no Copy. */
  onCopyAddress?: (address: string) => Promise<boolean>;
  /** Opens the system share sheet with the address. Without it, no Share. */
  onShareAddress?: (address: string) => void;
  /** Set on the card Share captures as an image: the title, network, QR code and address. */
  cardRef?: RefObject<unknown>;
  /** The app's device verification, mounted while one runs. Without it, no Verify. */
  VerifyAddressExecutor?: ComponentType<UseVerifyAddressExecutorViewModelParams>;
  /** What the account's coin family adds: notices and the device models that cannot verify. */
  getFamilyConfig?: ReceiveFamilyConfigPort;
}>;
