import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

export type ApyProps = {
  value: number;
  type: ApyType;
};

export const ApyView = ({
  value,
  type,
  appearance,
}: ApyProps & { appearance: "success" | "gray" }) => (
  <Tag size="sm" appearance={appearance} label={`~ ${value}% ${type}`} testID="apy-indicator" />
);
