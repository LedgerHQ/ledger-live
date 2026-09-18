import type { BottomSheetProps } from "@ledgerhq/lumen-ui-rnative";

export type ForgotPasswordSheetProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  bottomInset?: number;
  backgroundComponent?: BottomSheetProps["backgroundComponent"];
}>;
