import type { ReactNode } from "react";

export type SettingsSheetProps = Readonly<{
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  testID?: string;
}>;
