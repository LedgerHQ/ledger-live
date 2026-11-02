export type AccountAssetPickerRow = Readonly<{
  id: string;
  ledgerId: string;
  name: string;
  ticker: string;
  cryptoAmount: string;
  countervalue?: string;
}>;

export type AccountAssetPickerProps = Readonly<{
  open: boolean;
  rows: readonly AccountAssetPickerRow[];
  onSelect: (id: string) => void;
  onClose: () => void;
  testID?: string;
}>;
