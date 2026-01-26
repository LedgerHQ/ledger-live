import React from "react";

import { SendFlowLayoutView } from "./SendFlowLayoutView";
import { useSendFlowLayoutViewModel } from "./useSendFlowLayoutViewModel";
import type { SendFlowLayoutProps } from "./types";

/**
 * Container component for SendFlowLayout following MVVM pattern.
 * Connects the ViewModel to the View component.
 */
export function SendFlowLayout(props: SendFlowLayoutProps) {
  const viewModel = useSendFlowLayoutViewModel();

  return <SendFlowLayoutView {...props} {...viewModel} />;
}
