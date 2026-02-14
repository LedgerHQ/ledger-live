import React from "react";
import { accountsCount } from "./AccountCount";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { ApyIndicator } from "../ApyIndicator";

type ApyAppearance = "gray" | "success";

type AccountsCountAndApyProps = {
  label?: string;
  value?: number;
  type?: ApyType;
  appearance?: ApyAppearance;
};

export const accountsCountAndApy = ({ label, value, type, appearance }: AccountsCountAndApyProps) => (
  <>
    {label && accountsCount({ label })}
    {value && type ? <ApyIndicator value={value} type={type} appearance={appearance} /> : undefined}
  </>
);
