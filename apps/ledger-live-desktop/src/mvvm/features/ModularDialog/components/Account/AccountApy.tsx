import React from "react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { ApyIndicator } from "../ApyIndicator";

export const accountsApy = ({ value, type }: { value?: number; type?: ApyType }) => {
  return value && type ? <ApyIndicator value={value} type={type} /> : undefined;
};
