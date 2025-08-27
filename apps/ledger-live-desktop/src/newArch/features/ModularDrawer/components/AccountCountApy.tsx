import React from "react";
import { ApyIndicator } from "@ledgerhq/react-ui/pre-ldls/index";
import { ApyType } from "@ledgerhq/live-common/modularDrawer/types";
import { accountsCount } from "./AccountCount";

export const accountsCountAndApy = ({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: ApyType;
}) => (
  <>
    {accountsCount({ label })}
    <ApyIndicator value={value} type={type} />
  </>
);
