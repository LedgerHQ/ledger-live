import { useMemo } from "react";
import { isMoodIndexAvailable } from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";

export const useMoodIndexAvailability = (): boolean => {
  const region = getCountryLocale();
  return useMemo(() => isMoodIndexAvailable(region), [region]);
};
