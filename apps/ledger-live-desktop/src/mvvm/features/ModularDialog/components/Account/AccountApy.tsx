import React from "react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { ApyIndicator } from "../ApyIndicator";

type ApyAppearance = "gray" | "success";

type AccountsApyProps = {
  value?: number;
  type?: ApyType;
  appearance?: ApyAppearance;
};

export const accountsApy = ({ value, type, appearance }: AccountsApyProps) => {
  return value && type ? <ApyIndicator value={value} type={type} appearance={appearance} /> : undefined;
};
