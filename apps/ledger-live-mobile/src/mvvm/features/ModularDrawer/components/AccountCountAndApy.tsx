import React from "react";
import { accountsCount } from "./AccountCount";
import { ApyIndicator } from "./ApyIndicator";
import { ApyType } from "@domain/entity-interest-rate";

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
    {!!label && accountsCount({ label })}
    {!!value && !!type && <ApyIndicator value={value} type={type} />}
  </>
);
