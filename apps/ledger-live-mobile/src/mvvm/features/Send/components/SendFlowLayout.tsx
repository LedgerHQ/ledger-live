import React from "react";

import { SendFlowLayoutView } from "./SendFlowLayoutView";
import { useSendFlowLayoutViewModel } from "./useSendFlowLayoutViewModel";
import type { SendFlowLayoutProps } from "./types";

export function SendFlowLayout(props: SendFlowLayoutProps) {
  const viewModel = useSendFlowLayoutViewModel();

  return <SendFlowLayoutView {...props} {...viewModel} />;
}
