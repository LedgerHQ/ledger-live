import { useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  appConfigDevValueErrorsSelector,
  appConfigSavedDevValuesSelector,
  appConfigSavedSelectionsSelector,
  appConfigSessionSelector,
  reloadAppConfig,
  removeAppConfigDevValue,
  resetAppConfigSelection,
  resolveAppConfigValues,
  selectAppConfigOption,
  setAppConfigDevValue,
  type AppConfigState,
} from "@shared/app-config";
import type { DevToolsConfig } from "@devtools/registry";

type AppConfigToolProps = Extract<DevToolsConfig[number], { id: "app-config" }>["config"];

/**
 * Builds the app-config tool's props from the `appConfig` slice, which `createAppConfigMiddleware`
 * sets once the store is created. Selecting an option or saving a dev value only saves it: the app
 * runs on what is saved once the tool asks for a reload.
 */
export function useAppConfigToolProps(): AppConfigToolProps {
  const dispatch = useDispatch();
  const store = useStore<{ readonly appConfig: AppConfigState }>();
  const session = useSelector(appConfigSessionSelector);
  const savedSelections = useSelector(appConfigSavedSelectionsSelector);
  const savedDevValues = useSelector(appConfigSavedDevValuesSelector);
  const devValueErrors = useSelector(appConfigDevValueErrorsSelector);

  return useMemo<AppConfigToolProps>(
    () => ({
      session: mapSession({ session, savedSelections, savedDevValues, devValueErrors }),
      onSelect(id, selectionId) {
        dispatch(selectAppConfigOption({ id, selectionId }));
      },
      onResetSelection(id) {
        dispatch(resetAppConfigSelection(id));
      },
      onSetDevValue(name, value) {
        dispatch(setAppConfigDevValue({ name, value }));
        // The middleware records why it refused a dev value instead of saving it.
        return appConfigDevValueErrorsSelector(store.getState())[name] === undefined;
      },
      onRemoveDevValue(name) {
        dispatch(removeAppConfigDevValue(name));
      },
      onReloadApp() {
        dispatch(reloadAppConfig());
      },
    }),
    [dispatch, store, session, savedSelections, savedDevValues, devValueErrors],
  );
}

/**
 * What the tool lists from the `appConfig` slice: each value as this session runs on it, as the next
 * session will, and as it would without a dev value.
 */
function mapSession({
  session,
  savedSelections,
  savedDevValues,
  devValueErrors,
}: AppConfigState): AppConfigToolProps["session"] {
  if (!session) return undefined;
  const next = resolveAppConfigValues(session, savedSelections, savedDevValues);
  const valueStateOf = (name: string, baseValue: unknown) => ({
    name,
    currentValue: session.values[name],
    nextValue: next[name],
    baseValue,
    hasDevValue: Object.hasOwn(savedDevValues, name),
    rejectedDevValue: devValueErrors[name],
  });

  return {
    defaultOptionId: session.default,
    switches: Object.entries(session.switches).map(([id, { label, options }]) => ({
      id,
      label,
      currentSelectionId: session.selections[id] ?? session.default,
      savedSelectionId: savedSelections[id],
      values: Object.entries(options[session.default]).map(([name, baseValue]) =>
        valueStateOf(name, baseValue),
      ),
    })),
    fixedValues: Object.entries(session.fixed).map(([name, baseValue]) => ({
      ...valueStateOf(name, baseValue),
      isDevCurrent: session.selections[name] === "dev",
      isDevSaved: savedSelections[name] === "dev",
    })),
  };
}
