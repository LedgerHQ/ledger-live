import { useMemo } from "react";
import { isMoodIndexAvailable } from "@features/flow-fear-and-greed";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export const useMoodIndexAvailability = (): boolean => {
  const { region } = getParsedSystemDeviceLocale();
  return useMemo(() => isMoodIndexAvailable(region), [region]);
};
