import React from "react";
import { useDeviceIntentExecutorHeaderOverride } from "../../hooks/useDeviceIntentExecutorHeaderOverride";

type OverrideDeviceIntentExecutorHeaderProps = Readonly<{
  children: React.ReactNode;
}>;

export function OverrideDeviceIntentExecutorHeader({
  children,
}: OverrideDeviceIntentExecutorHeaderProps): React.ReactElement | null {
  const hasHeaderOverrideProvider = useDeviceIntentExecutorHeaderOverride();

  if (!hasHeaderOverrideProvider) return null;

  return <>{children}</>;
}
