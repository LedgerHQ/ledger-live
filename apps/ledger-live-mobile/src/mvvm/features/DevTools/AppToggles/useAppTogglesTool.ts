import { useCallback, useMemo } from "react";
import type { DevToolsConfig } from "@devtools/shell";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { setSimulateApolloDevice } from "~/actions/settings";
import { simulateApolloDeviceSelector } from "~/reducers/settings";

type AppTogglesToolProps = Extract<DevToolsConfig[number], { id: "app-toggles" }>["config"];

/** Binds the app-toggles devtool to the mobile settings it toggles. */
export function useAppTogglesTool(): AppTogglesToolProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isApolloDeviceSimulated = useSelector(simulateApolloDeviceSelector);

  const onSimulateApolloDeviceChange = useCallback(
    (isOn: boolean) => {
      dispatch(setSimulateApolloDevice(isOn));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      toggles: [
        {
          id: "simulate-apollo-device",
          label: t("settings.debug.devTools.appToggles.simulateApolloDevice.label"),
          description: t("settings.debug.devTools.appToggles.simulateApolloDevice.description"),
          isOn: isApolloDeviceSimulated,
          lockedReason: null,
          onChange: onSimulateApolloDeviceChange,
        },
      ],
    }),
    [t, isApolloDeviceSimulated, onSimulateApolloDeviceChange],
  );
}
