import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

type ApyAppearance = "gray" | "success";

type AccountsApyProps = {
  value?: number;
  type?: ApyType;
  appearance?: ApyAppearance;
};

export const accountsApy = ({ value, type, appearance = "gray" }: AccountsApyProps) => {
  if (!value || !type) return undefined;

  return <Tag size="sm" appearance={appearance} label={`~ ${value}% ${type}`} />;
};
