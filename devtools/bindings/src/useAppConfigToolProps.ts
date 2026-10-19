import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  APP_CONFIG_OPTION_IDS,
  appConfigSavedSelectionsSelector,
  appConfigSessionSelector,
  reloadAppConfig,
  resetAppConfigSwitch,
  selectAppConfigOption,
} from "@shared/app-config";
import type { DevToolsConfig } from "@devtools/registry";

type AppConfigToolProps = Extract<DevToolsConfig[number], { id: "app-config" }>["config"];

/**
 * Builds the app-config tool's props from the `appConfig` slice, which `createAppConfigMiddleware`
 * sets once the store is created. Selecting or resetting an option only saves it: the app runs on
 * the saved options once the tool asks for a reload.
 */
export function useAppConfigToolProps(): AppConfigToolProps {
  const dispatch = useDispatch();
  const session = useSelector(appConfigSessionSelector);
  const savedSelections = useSelector(appConfigSavedSelectionsSelector);

  return useMemo<AppConfigToolProps>(
    () => ({
      defaultOptionId: session?.default,
      switches: session
        ? Object.entries(session.switches).map(([id, { label, options }]) => ({
            id,
            label,
            options: APP_CONFIG_OPTION_IDS.map(optionId => ({
              id: optionId,
              values: options[optionId],
            })),
            currentOptionId: session.selections[id] ?? session.default,
            savedOptionId: savedSelections[id],
          }))
        : [],
      onSelectOption(switchId, optionId) {
        dispatch(selectAppConfigOption({ switchId, optionId }));
      },
      onResetSwitch(switchId) {
        dispatch(resetAppConfigSwitch(switchId));
      },
      onReloadApp() {
        dispatch(reloadAppConfig());
      },
    }),
    [dispatch, session, savedSelections],
  );
}
