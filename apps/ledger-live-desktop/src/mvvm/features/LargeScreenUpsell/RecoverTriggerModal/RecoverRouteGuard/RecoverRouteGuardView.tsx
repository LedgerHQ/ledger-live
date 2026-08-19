import React from "react";
import RecoverTriggerModal from "..";
import type { RecoverRouteGuardViewProps } from "./useRecoverRouteGuardViewModel";

type Props = RecoverRouteGuardViewProps &
  Readonly<{
    children: React.ReactNode;
  }>;

export function RecoverRouteGuardView({ shouldBlock, children }: Props) {
  if (shouldBlock) {
    return <RecoverTriggerModal />;
  }

  return children;
}
