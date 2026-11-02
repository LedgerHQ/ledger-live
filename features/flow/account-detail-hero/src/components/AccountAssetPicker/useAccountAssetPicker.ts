import { useCallback, useMemo, useState } from "react";
import { sortAssetsByValue } from "@features/platform-quick-actions";
import type { AccountAssetPickerProps, AccountAssetPickerSource } from "./AccountAssetPicker.types";

type Pending<T> = Readonly<{
  items: readonly T[];
  onPicked: (item: T) => void;
}>;

export type AccountAssetPickerController<T> = Readonly<{
  pickAsset: (items: readonly T[], onPicked: (item: T) => void) => void;
  pickerProps: AccountAssetPickerProps;
}>;

export function useAccountAssetPicker<T>(
  toSources: (items: readonly T[]) => readonly AccountAssetPickerSource<T>[],
): AccountAssetPickerController<T> {
  const [pending, setPending] = useState<Pending<T>>();

  const pickAsset = useCallback((items: readonly T[], onPicked: (item: T) => void) => {
    if (items.length === 0) return;
    if (items.length === 1) {
      onPicked(items[0]);
      return;
    }
    setPending({ items, onPicked });
  }, []);

  const sources = useMemo(
    () => (pending ? sortAssetsByValue(toSources(pending.items), source => source.sortValue) : []),
    [pending, toSources],
  );

  const onClose = useCallback(() => setPending(undefined), []);

  const onSelect = useCallback(
    (id: string) => {
      const picked = sources.find(source => source.row.id === id);
      setPending(undefined);
      if (picked) pending?.onPicked(picked.item);
    },
    [pending, sources],
  );

  const pickerProps = useMemo(
    (): AccountAssetPickerProps => ({
      open: pending !== undefined,
      rows: sources.map(source => source.row),
      onSelect,
      onClose,
    }),
    [onClose, onSelect, pending, sources],
  );

  return { pickAsset, pickerProps };
}
