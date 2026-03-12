import { useMemo } from "react";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";

export const useApyIndicatorViewModel = () => {
  const region = getCountryLocale();
  const appearance = useMemo(() => getApyAppearance(region), [region]);
  return { appearance };
};
