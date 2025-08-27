import React from "react";
import { ApyIndicator } from "@ledgerhq/native-ui/pre-ldls/index";
import { accountsCount } from "./AccountCount";

export const accountsCountAndApy = ({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "NRR" | "APY" | "APR";
}) => (
  <>
    {accountsCount({ label })}
    <ApyIndicator value={value} type={type} />
  </>
);
