import React from "react";
import type { ReconnectSheetProps } from "./ReconnectSheet.types";
import { ReconnectSheetView } from "./ReconnectSheetView";
import { useReconnectSheetViewModel } from "./useReconnectSheetViewModel";

export function ReconnectSheet(props: ReconnectSheetProps) {
  const viewProps = useReconnectSheetViewModel(props);
  return viewProps ? <ReconnectSheetView {...viewProps} /> : null;
}
