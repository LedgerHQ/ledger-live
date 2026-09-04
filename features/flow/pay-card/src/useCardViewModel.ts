import { useMemo } from "react";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";
import type { CardProps, CardViewProps } from "./Card.types";

/** Never called: the wallet queries are skipped whenever the host omits its own resolver. */
const NO_COUNTER_VALUE: ResolveWalletCounterValue = () => null;

/**
 * View model for the Pay Card flow. The card balance is the total of the wallets currently linked to
 * the card, so the flow owns it; hosts only hand over the three things the flow cannot know — the
 * countervalue formatter and resolver (locale, counter-value currency, rates) and the localized
 * label. Without the formatter and the label, the card falls back to the bare artwork.
 */
export function useCardViewModel({
  title,
  oauthConfig,
  callback,
  formatCountervalue,
  balanceLabel,
  resolveCounterValue,
}: CardProps): CardViewProps {
  const { total, isLoading } = useCardLinkedWallets({
    resolveCounterValue: resolveCounterValue ?? NO_COUNTER_VALUE,
    skip: !resolveCounterValue,
  });

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!formatCountervalue || balanceLabel === undefined) return undefined;
    return { balance: total, formatCountervalue, balanceLabel, isLoading };
  }, [formatCountervalue, balanceLabel, total, isLoading]);

  return { title, oauthConfig, callback, cardVisual };
}
