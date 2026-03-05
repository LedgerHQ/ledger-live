import React from "react";
import type { ApyProps } from "@ledgerhq/live-common/modularDrawer/types/index";
import { ApyView } from "./ApyView";
import { useApyIndicatorViewModel } from "./useApyIndicatorViewModel";

export const ApyIndicator = (props: ApyProps) => (
  <ApyView {...props} {...useApyIndicatorViewModel()} />
);
