import React from "react";
import { accountsCount } from "./AccountCount";
import { ApyIndicator } from "./ApyIndicator";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

export const accountsCountAndApy = ({
  label,
  value,
  type,
}: {
  label?: string;
  value?: number;
  type?: ApyType;
}) => (
  <>
    {label && accountsCount({ label })}
    {value !== null && value !== undefined && !!type && <ApyIndicator value={value} type={type} />}
  </>
);
