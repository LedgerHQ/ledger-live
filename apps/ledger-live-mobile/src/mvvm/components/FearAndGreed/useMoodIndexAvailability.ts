import { useMemo } from "react";
import { isMoodIndexAvailable } from "@features/flow-fear-and-greed";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";

export const useMoodIndexAvailability = (): boolean => {
  const region = getCountryLocale();
  return useMemo(() => isMoodIndexAvailable(region), [region]);
};
