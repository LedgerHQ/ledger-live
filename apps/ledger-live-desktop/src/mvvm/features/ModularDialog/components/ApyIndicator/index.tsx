import React from "react";
import type { ApyProps } from "@ledgerhq/live-common/modularDrawer/types/index";

import { useApyIndicatorViewModel } from "./useApyIndicatorViewModel";
import { ApyView } from "./ApyView";

export const ApyIndicator = (props: ApyProps) => {
  return <ApyView {...props} {...useApyIndicatorViewModel()} />;
};
