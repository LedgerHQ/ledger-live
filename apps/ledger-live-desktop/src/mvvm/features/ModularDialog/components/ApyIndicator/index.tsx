import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export const ApyIndicator = ({ value, type }: { value: number; type: ApyType }) => {
  const { region } = getParsedSystemDeviceLocale();
  const appearance = getApyAppearance(region);

  return <Tag size="sm" appearance={appearance} label={`~ ${value}% ${type}`} />;
};
