import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  appConfigSavedDevValuesSelector,
  appConfigSavedSelectionsSelector,
  appConfigSessionSelector,
  reloadAppConfig,
  resetAppConfigSelection,
  resolveAppConfigValues,
  selectAppConfigOption,
  type AppConfigState,
} from "@shared/app-config";
import type { DevToolsConfig } from "@devtools/registry";

type AppConfigToolProps = Extract<DevToolsConfig[number], { id: "app-config" }>["config"];

/**
 * Builds the app-config tool's props from the `appConfig` slice, which `createAppConfigMiddleware`
 * sets once the store is created. Selecting an option only saves it: the app runs on what is saved
 * once the tool asks for a reload.
 */
export function useAppConfigToolProps(): AppConfigToolProps {
  const dispatch = useDispatch();
  const session = useSelector(appConfigSessionSelector);
  const savedSelections = useSelector(appConfigSavedSelectionsSelector);
  const savedDevValues = useSelector(appConfigSavedDevValuesSelector);

  return useMemo<AppConfigToolProps>(
    () => ({
      session: mapSession({ session, savedSelections, savedDevValues }),
      onSelect(id, selectionId) {
        dispatch(selectAppConfigOption({ id, selectionId }));
      },
      onResetSelection(id) {
        dispatch(resetAppConfigSelection(id));
      },
      onReloadApp() {
        dispatch(reloadAppConfig());
      },
    }),
    [dispatch, session, savedSelections, savedDevValues],
  );
}

/**
 * What the tool lists from the `appConfig` slice: each value as this session runs on it, and as the
 * next session will.
 */
function mapSession({
  session,
  savedSelections,
  savedDevValues,
}: Omit<AppConfigState, "devValueErrors">): AppConfigToolProps["session"] {
  if (!session) return undefined;
  const next = resolveAppConfigValues(session, savedSelections, savedDevValues);
  const valueStateOf = (name: string) => ({
    name,
    currentValue: session.values[name],
    nextValue: next[name],
  });

  return {
    defaultOptionId: session.default,
    switches: Object.entries(session.switches).map(([id, { label, options }]) => ({
      id,
      label,
      currentSelectionId: session.selections[id] ?? session.default,
      savedSelectionId: savedSelections[id],
      values: Object.keys(options[session.default]).map(valueStateOf),
    })),
    fixedValues: Object.keys(session.fixed).map(name => ({
      ...valueStateOf(name),
      isDevCurrent: session.selections[name] === "dev",
      isDevSaved: savedSelections[name] === "dev",
    })),
  };
}
