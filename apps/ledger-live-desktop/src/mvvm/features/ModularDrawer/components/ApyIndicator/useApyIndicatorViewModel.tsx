import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useMemo } from "react";

export const useApyIndicatorViewModel = () => {
  const { region } = getParsedSystemDeviceLocale();
  const appearance = useMemo(() => getApyAppearance(region), [region]);

  return { appearance };
};
