import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

type ApyAppearance = "gray" | "success";

type ApyIndicatorProps = {
  value: number;
  type: ApyType;
  appearance?: ApyAppearance;
};

export const ApyIndicator = ({ value, type, appearance = "gray" }: ApyIndicatorProps) => {
  return <Tag size="sm" appearance={appearance} label={`~ ${value}% ${type}`} />;
};
