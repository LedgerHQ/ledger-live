import React from "react";
import { accountsCount } from "./AccountCount";
import type { ApyType } from "@domain/entity-interest-rate";
import { ApyIndicator } from "../ApyIndicator";

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
