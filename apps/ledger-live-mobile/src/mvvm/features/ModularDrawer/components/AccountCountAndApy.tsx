import React from "react";
import { accountsCount } from "./AccountCount";
import { accountsApy } from "./AccountApy";
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
    {accountsApy({ value, type })}
  </>
);
