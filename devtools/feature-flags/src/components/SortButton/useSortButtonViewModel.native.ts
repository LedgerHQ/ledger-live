import { useCallback } from "react";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import type { SortCategory, SortDirection } from "../../hooks";

export interface SortButtonInput {
  readonly category: SortCategory;
  readonly direction: SortDirection;
  readonly setSort: (category: SortCategory, direction: SortDirection) => void;
}

interface SortOption {
  readonly category: SortCategory;
  readonly direction: SortDirection;
  readonly label: string;
}

interface SortOptionItem extends SortOption {
  readonly key: string;
  readonly isActive: boolean;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { category: "name", direction: "asc", label: "A→Z" },
  { category: "name", direction: "desc", label: "Z→A" },
  { category: "overridden", direction: "asc", label: "Overridden first" },
  { category: "overridden", direction: "desc", label: "Overridden last" },
  { category: "enabled", direction: "asc", label: "Enabled first" },
  { category: "enabled", direction: "desc", label: "Enabled last" },
];

export interface SortButtonViewProps {
  readonly sheetRef: ReturnType<typeof useBottomSheetRef>;
  readonly openSheet: () => void;
  readonly activeLabel: string;
  readonly options: readonly SortOptionItem[];
  readonly select: (option: SortOption) => void;
}

export function useSortButtonViewModel({
  category,
  direction,
  setSort,
}: SortButtonInput): SortButtonViewProps {
  const sheetRef = useBottomSheetRef();

  const options = SORT_OPTIONS.map(option => ({
    ...option,
    key: `${option.category}-${option.direction}`,
    isActive: option.category === category && option.direction === direction,
  }));

  const activeLabel = options.find(option => option.isActive)?.label ?? "Sort";

  const select = useCallback(
    (option: SortOption) => {
      sheetRef.current?.dismiss();
      setSort(option.category, option.direction);
    },
    [sheetRef, setSort],
  );

  return {
    sheetRef,
    openSheet: useCallback(() => sheetRef.current?.present(), [sheetRef]),
    activeLabel,
    options,
    select,
  };
}
