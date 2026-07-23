export type PnlDetailItem = {
  title: string;
  value: string;
  definition?: string;
  percentage?: number;
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
  /** Optional muted footer (body4, muted) rendered below the items. */
  footer?: string;
  discreet?: boolean;
  testID?: string;
  pageName?: string;
  source?: string;
};
