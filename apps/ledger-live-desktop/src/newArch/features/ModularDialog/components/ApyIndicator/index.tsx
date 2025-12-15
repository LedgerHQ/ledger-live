import React from "react";
import { Tag } from "@ledgerhq/ldls-ui-react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

export const ApyIndicator = ({ value, type }: { value: number; type: ApyType }) => {
  return <Tag size="sm" appearance="gray" label={`~ ${value}% ${type}`} />;
};
