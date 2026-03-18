import React from "react";
import { accountsCount } from "./AccountCount";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { ApyIndicator } from "LLD/features/ModularDrawer/components/ApyIndicator";

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
    {!!value && !!type ? <ApyIndicator value={value} type={type} /> : null}
  </>
);
