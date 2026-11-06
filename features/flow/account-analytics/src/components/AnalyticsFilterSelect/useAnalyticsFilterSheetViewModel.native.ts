import { useCallback, useState } from "react";
import type { AnalyticsFilterViewProps } from "../AnalyticsFilters/AnalyticsFiltersView.types";

export type AnalyticsFilterSheetViewModel = Readonly<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  selectOption: (value: string | null) => void;
}>;

export function useAnalyticsFilterSheetViewModel({
  onOpenChange,
  onValueChange,
}: Pick<
  AnalyticsFilterViewProps,
  "onOpenChange" | "onValueChange"
>): AnalyticsFilterSheetViewModel {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange(true);
  }, [onOpenChange]);
  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);
  const selectOption = useCallback(
    (value: string | null) => {
      close();
      if (value !== null) onValueChange(value);
    },
    [close, onValueChange],
  );
  return { isOpen, open, close, selectOption };
}
