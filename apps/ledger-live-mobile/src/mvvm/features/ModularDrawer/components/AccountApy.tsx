import React, { useMemo } from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";

export const ApyIndicator = ({ value, type }: { value: number; type: ApyType }) => {
  const appearance = useMemo(() => getApyAppearance(getCountryLocale()), []);
  return <Tag size="sm" appearance={appearance} label={`~ ${value}% ${type}`} />;
};

export const accountsApy = ({ value, type }: { value?: number; type?: ApyType }) => {
  if (!value || !type) return undefined;
  return <ApyIndicator value={value} type={type} />;
};
