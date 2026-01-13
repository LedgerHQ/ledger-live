import { shouldShowNoahMenu, NoahParams } from "./shouldShowNoahMenu";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Check if the noah menu should be shown based on the feature flag and the route
 */

export const useReceiveNoahEntry = (params: NoahParams) => {
  const noah = useFeature("noah");
  const showMenu = shouldShowNoahMenu(
    params,
    noah?.enabled ?? false,
    noah?.params?.activeCurrencyIds ?? [],
  );

  return {
    showNoahMenu: showMenu,
  };
};
