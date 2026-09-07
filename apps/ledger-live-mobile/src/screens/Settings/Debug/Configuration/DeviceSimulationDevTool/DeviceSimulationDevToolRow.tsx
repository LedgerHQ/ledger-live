import React from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { formatCurrentHistoryDisplay } from "./deviceSimulationLabels";
import { useDeviceSimulationDevToolViewModel } from "./useDeviceSimulationDevToolViewModel";

const DeviceSimulationDevToolRow = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const { currentHistoryLabels } = useDeviceSimulationDevToolViewModel();

  const currentHistoryDisplay = formatCurrentHistoryDisplay(t, currentHistoryLabels);

  return (
    <SettingsRow
      title={t("settings.debug.deviceSimulationDevTool.title")}
      desc={t("settings.debug.deviceSimulationDevTool.currentHistory", {
        devices: currentHistoryDisplay,
      })}
      iconLeft={<IconsLegacy.DevicesAltMedium size={32} color="black" />}
      arrowRight
      testID="device-simulation-row"
      onPress={() => navigation.navigate(ScreenName.DebugDeviceSimulation)}
    />
  );
};

export default DeviceSimulationDevToolRow;
