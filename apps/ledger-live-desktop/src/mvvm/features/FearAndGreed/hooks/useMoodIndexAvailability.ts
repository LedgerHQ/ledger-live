import { useMemo } from "react";
import { isMoodIndexAvailable } from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export const useMoodIndexAvailability = (): boolean => {
  const { region } = getParsedSystemDeviceLocale();
  return useMemo(() => isMoodIndexAvailable(region), [region]);
};
