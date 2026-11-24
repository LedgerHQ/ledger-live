import type { ReactNode } from "react";

export type SettingsSectionProps = Readonly<{
  title?: string;
  children: ReactNode;
  testID?: string;
}>;
