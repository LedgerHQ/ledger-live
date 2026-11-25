import { useApolloHiddenSettings } from "@features/flow-settings";
import { useSelector } from "~/context/hooks";
import { simulateApolloDeviceSelector } from "~/reducers/settings";

/** Rows the new Settings hide on this device. Apollo is simulated until Device XP tells. */
export function useSettingsRowsToHide() {
  const isApollo = useSelector(simulateApolloDeviceSelector);
  return useApolloHiddenSettings(isApollo);
}
