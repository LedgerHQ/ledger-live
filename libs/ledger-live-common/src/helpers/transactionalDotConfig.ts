import type { OperationType } from "@ledgerhq/types-live";

export type TransactionalDotAppearance = "success" | "muted" | "error";

export type TransactionalDotSymbol =
  | "ArrowDown"
  | "ArrowUp"
  | "Close"
  | "Invoice"
  | "Link"
  | "Mailbox"
  | "PenEdit"
  | "Snow"
  | "StarFill"
  | "Unlink"
  | "Spinner";

export type TransactionalDotConfig = {
  symbol: TransactionalDotSymbol;
  appearance: TransactionalDotAppearance;
};

export function getTransactionalDotConfig(
  operationType: OperationType,
  isPending: boolean,
  hasFailed?: boolean,
): TransactionalDotConfig | null {
  if (hasFailed) {
    return { symbol: "Close", appearance: "error" };
  }
  if (isPending) {
    return { symbol: "Spinner", appearance: "muted" };
  }

  switch (operationType) {
    case "IN":
    case "NFT_IN":
      return { symbol: "ArrowDown", appearance: "success" };
    case "OUT":
    case "NFT_OUT":
      return { symbol: "ArrowUp", appearance: "muted" };
    case "FEES":
      return { symbol: "Invoice", appearance: "muted" };
    case "REWARD":
    case "WITHDRAW":
    case "WITHDRAW_EXPIRE_UNFREEZE":
    case "REWARD_PAYOUT":
    case "WITHDRAW_UNBONDED":
    case "WITHDRAW_UNSTAKED":
      return { symbol: "StarFill", appearance: "success" };
    case "DELEGATE":
    case "REDELEGATE":
    case "BOND":
    case "LOCK":
    case "STAKE":
      return { symbol: "Link", appearance: "muted" };
    case "UNDELEGATE":
    case "UNDELEGATE_RESOURCE":
    case "UNBOND":
    case "UNLOCK":
    case "UNSTAKE":
      return { symbol: "Unlink", appearance: "muted" };
    case "APPROVE":
      return { symbol: "PenEdit", appearance: "muted" };
    case "FREEZE":
    case "UNFREEZE":
    case "LEGACY_UNFREEZE":
      return { symbol: "Snow", appearance: "muted" };
    case "VOTE":
      return { symbol: "Mailbox", appearance: "muted" };
    default:
      return null;
  }
}
