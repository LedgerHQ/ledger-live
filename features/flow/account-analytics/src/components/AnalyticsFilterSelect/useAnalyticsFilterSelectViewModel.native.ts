import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { AnalyticsFilterViewProps } from "../AnalyticsFilters/AnalyticsFiltersView.types";

export type AnalyticsFilterSelectViewModel = Readonly<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  selectOption: (value: string | null) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchPlaceholder: string;
  noResultsTitle: string;
}>;

export function useAnalyticsFilterSelectViewModel({
  onOpenChange,
  onValueChange,
}: Pick<
  AnalyticsFilterViewProps,
  "onOpenChange" | "onValueChange"
>): AnalyticsFilterSelectViewModel {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange(true);
  }, [onOpenChange]);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchValue("");
    onOpenChange(false);
  }, [onOpenChange]);
  const selectOption = useCallback(
    (value: string | null) => {
      close();
      if (value !== null) onValueChange(value);
    },
    [close, onValueChange],
  );
  return {
    isOpen,
    open,
    close,
    selectOption,
    searchValue,
    setSearchValue,
    searchPlaceholder: t("common.search"),
    noResultsTitle: t("accountAnalytics.noResults"),
  };
}
