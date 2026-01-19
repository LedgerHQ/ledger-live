import React from "react";
import { ApyIndicator } from "@ledgerhq/native-ui/pre-ldls/index";
import { accountsCount } from "./AccountCount";
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
    {value && type ? <ApyIndicator value={value} type={type} /> : undefined}
  </>
);
