import { useCallback, useState } from "react";
import type { AccountBalanceSummaryProps, BalanceItem } from "./AccountBalanceSummary.types";

const CARDS_PER_ROW = 2;

const inRows = (items: readonly BalanceItem[]) =>
  Array.from({ length: Math.ceil(items.length / CARDS_PER_ROW) }, (_, index) =>
    items.slice(index * CARDS_PER_ROW, (index + 1) * CARDS_PER_ROW),
  );

export type AccountBalanceSummaryViewModel = Readonly<{
  rows: readonly (readonly BalanceItem[])[];
  cardsPerRow: number;
  discreet: boolean;
  infoItem: BalanceItem | undefined;
  onShowDescription: (itemId: string) => void;
  onCloseInfo: () => void;
  testID?: string;
}>;

export const useAccountBalanceSummaryViewModel = ({
  items,
  discreet = false,
  testID,
}: AccountBalanceSummaryProps): AccountBalanceSummaryViewModel => {
  const [infoItemId, setInfoItemId] = useState<string>();
  const onCloseInfo = useCallback(() => setInfoItemId(undefined), []);

  return {
    rows: inRows(items),
    cardsPerRow: CARDS_PER_ROW,
    discreet,
    infoItem: items.find(({ id }) => id === infoItemId),
    onShowDescription: setInfoItemId,
    onCloseInfo,
    testID,
  };
};
