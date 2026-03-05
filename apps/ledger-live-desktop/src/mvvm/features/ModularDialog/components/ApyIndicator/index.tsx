import React from "react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

import { useApyIndicatorViewModel } from "./useApyIndicatorViewModel";
import { ApyView } from "./ApyView";

export type ApyProps = {
  value: number;
  type: ApyType;
};

export const ApyIndicator = (props: ApyProps) => {
  return <ApyView {...props} {...useApyIndicatorViewModel()} />;
};
