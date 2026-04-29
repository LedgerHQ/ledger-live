import type { ComponentType } from "react";
import type { StyleProp, TextStyle } from "react-native";
import type { DotIconAppearance, IconSize } from "@ledgerhq/lumen-ui-rnative";
import type { OperationType } from "@ledgerhq/types-live";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Close,
  Invoice,
  Link,
  Mailbox,
  PenEdit,
  Snow,
  Star,
  Unlink,
} from "@ledgerhq/lumen-ui-rnative/symbols";

type TransactionalDotIcon = ComponentType<{
  size?: IconSize;
  style?: StyleProp<TextStyle>;
}>;

type TransactionalDotConfig = {
  icon: TransactionalDotIcon;
  appearance: DotIconAppearance;
};

export function getTransactionalDotConfig(
  operationType: OperationType,
  isPending: boolean,
  hasFailed?: boolean,
): TransactionalDotConfig | null {
  if (hasFailed) {
    return { icon: Close, appearance: "error" };
  }
  if (isPending) {
    return { icon: Clock, appearance: "muted" };
  }

  switch (operationType) {
    case "IN":
    case "NFT_IN":
      return { icon: ArrowDown, appearance: "success" };
    case "OUT":
    case "NFT_OUT":
      return { icon: ArrowUp, appearance: "muted" };
    case "FEES":
      return { icon: Invoice, appearance: "muted" };
    case "REWARD":
    case "WITHDRAW":
    case "WITHDRAW_EXPIRE_UNFREEZE":
    case "REWARD_PAYOUT":
    case "WITHDRAW_UNBONDED":
    case "WITHDRAW_UNSTAKED":
      return { icon: Star, appearance: "success" };
    case "DELEGATE":
    case "REDELEGATE":
    case "BOND":
    case "LOCK":
    case "STAKE":
      return { icon: Link, appearance: "muted" };
    case "UNDELEGATE":
    case "UNDELEGATE_RESOURCE":
    case "UNBOND":
    case "UNLOCK":
    case "UNSTAKE":
      return { icon: Unlink, appearance: "muted" };
    case "APPROVE":
      return { icon: PenEdit, appearance: "muted" };
    case "FREEZE":
    case "UNFREEZE":
    case "LEGACY_UNFREEZE":
      return { icon: Snow, appearance: "muted" };
    case "VOTE":
      return { icon: Mailbox, appearance: "muted" };
    default:
      return null;
  }
}
