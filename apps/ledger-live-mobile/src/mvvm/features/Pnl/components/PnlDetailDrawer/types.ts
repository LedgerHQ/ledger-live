export type PnlDetailItem = {
  title: string;
  value: string;
  definition?: string;
};

export type PnlDetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Short subtitle rendered inside the BottomSheetHeader (body2, muted). */
  description?: string;
  /** Longer body text rendered inside the BottomSheetView (body1, base color). */
  bodyText?: string;
  items?: PnlDetailItem[];
  testID?: string;
};
