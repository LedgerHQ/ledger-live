import React from "react";
import { accountsCount } from "./AccountCount";
import { accountsApy } from "./AccountApy";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

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
    {accountsApy({ value, type, appearance })}
  </>
);
