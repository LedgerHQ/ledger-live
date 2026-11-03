import { useCallback, useState } from "react";
import type { AccountAssetPickerRow } from "../AccountAssetPicker.types";

const NO_ROWS: readonly AccountAssetPickerRow[] = [];

export type AccountAssetPickerViewModel = Readonly<{
  rows: readonly AccountAssetPickerRow[];
  isContentMounted: boolean;
  onHidden: () => void;
}>;

export function useAccountAssetPickerViewModel({
  open,
  rows,
}: Readonly<{
  open: boolean;
  rows: readonly AccountAssetPickerRow[];
}>): AccountAssetPickerViewModel {
  const [shownRows, setShownRows] = useState<readonly AccountAssetPickerRow[] | undefined>(() =>
    open ? rows : undefined,
  );

  if (open && shownRows !== rows) setShownRows(rows);

  const onHidden = useCallback(() => {
    setShownRows(current => (open ? current : undefined));
  }, [open]);

  return {
    rows: shownRows ?? NO_ROWS,
    isContentMounted: shownRows !== undefined,
    onHidden,
  };
}
