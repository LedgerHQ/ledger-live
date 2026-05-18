import { useSelector } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { PnlDetailDrawerProps, PnlDetailItem } from "./types";

const DISCREET_PLACEHOLDER = "***";

export type PnlDetailDrawerViewModel = Omit<PnlDetailDrawerProps, "items"> & {
  discreet: boolean;
  items: PnlDetailItem[];
};

export function usePnlDetailDrawerViewModel({
  isOpen,
  onClose,
  title,
  description,
  bodyText,
  items = [],
  testID,
}: PnlDetailDrawerProps): PnlDetailDrawerViewModel {
  const discreet = useSelector(discreetModeSelector);

  const displayedItems: PnlDetailItem[] = discreet
    ? items.map(item => ({ ...item, value: DISCREET_PLACEHOLDER }))
    : items;

  return {
    isOpen,
    onClose,
    title,
    description,
    bodyText,
    items: displayedItems,
    discreet,
    testID,
  };
}
