import { useCallback, useState } from "react";
import type { AccountAsset } from "LLM/utils/accountAssets";

type Selection = Readonly<{
  assets: readonly AccountAsset[];
  onPicked: (asset: AccountAsset) => void;
}>;

export type AccountAssetPickerSheetProps = Readonly<{
  isOpen: boolean;
  assets: readonly AccountAsset[];
  onSelect: (asset: AccountAsset) => void;
  onClose: () => void;
}>;

export type AccountAssetPicker = Readonly<{
  pickAsset: (assets: readonly AccountAsset[], onPicked: (asset: AccountAsset) => void) => void;
  sheetProps: AccountAssetPickerSheetProps;
}>;

const NO_ASSETS: readonly AccountAsset[] = [];

export function useAccountAssetPicker(): AccountAssetPicker {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const pickAsset = useCallback(
    (assets: readonly AccountAsset[], onPicked: (asset: AccountAsset) => void) => {
      if (assets.length === 0) return;
      if (assets.length === 1) {
        onPicked(assets[0]);
        return;
      }
      setSelection({ assets, onPicked });
      setIsOpen(true);
    },
    [],
  );

  const onClose = useCallback(() => setIsOpen(false), []);

  const onSelect = useCallback(
    (asset: AccountAsset) => {
      setIsOpen(false);
      selection?.onPicked(asset);
    },
    [selection],
  );

  return {
    pickAsset,
    sheetProps: { isOpen, assets: selection?.assets ?? NO_ASSETS, onSelect, onClose },
  };
}
