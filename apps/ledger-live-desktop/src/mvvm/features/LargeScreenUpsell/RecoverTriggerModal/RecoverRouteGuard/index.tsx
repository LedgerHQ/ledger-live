import React from "react";
import { RecoverRouteGuardView } from "./RecoverRouteGuardView";
import { useRecoverRouteGuardViewModel } from "./useRecoverRouteGuardViewModel";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function RecoverRouteGuard({ children }: Props) {
  return (
    <RecoverRouteGuardView {...useRecoverRouteGuardViewModel()}>{children}</RecoverRouteGuardView>
  );
}
