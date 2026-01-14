import React from "react";
import { ApyIndicator } from "@ledgerhq/native-ui/pre-ldls/index";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

export const accountsApy = ({ value, type }: { value?: number; type?: ApyType }) => {
  return value && type ? <ApyIndicator value={value} type={type} /> : undefined;
};
