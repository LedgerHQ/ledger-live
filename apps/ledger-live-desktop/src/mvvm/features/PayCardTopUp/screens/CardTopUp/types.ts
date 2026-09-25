import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import type { CardTopUpAmountViewProps } from "@features/flow-pay-card-top-up";
import type { CardTopUpDeviceStep } from "../../hooks/useCardTopUpExecution";

export type CardTopUpData = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  asset: CardAssetRow;
}>;

export type CardTopUpInputMode = "fiat" | "crypto";

export type CardTopUpViewModel = CardTopUpAmountViewProps &
  Readonly<{
    deviceStep: CardTopUpDeviceStep;
    onRetry: () => void;
    onDeviceError: (error: Error) => void;
    onClose: () => void;
  }>;
