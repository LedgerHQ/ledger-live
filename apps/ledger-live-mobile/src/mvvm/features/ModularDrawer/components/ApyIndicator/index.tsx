import React from "react";
import { ApyView, ApyProps } from "./ApyView";
import { useApyIndicatorViewModel } from "./useApyIndicatorViewModel";

export const ApyIndicator = (props: ApyProps) => (
  <ApyView {...props} {...useApyIndicatorViewModel()} />
);
