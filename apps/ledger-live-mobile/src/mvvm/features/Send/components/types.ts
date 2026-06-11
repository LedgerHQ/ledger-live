import type React from "react";

export type SendFlowLayoutProps = Readonly<{
  /** Page-layout only. Bottom sheet steps use the Lumen bottom sheet header. */
  headerRight?: React.ReactNode;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}>;
