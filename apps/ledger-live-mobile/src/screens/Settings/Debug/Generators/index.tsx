import React, { useCallback } from "react";
import { getEnv } from "@shared/env";
import { Alert as Confirmation } from "react-native";
import { Alert, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch } from "~/context/hooks";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import ToggleServiceStatusIncident from "./ToggleServiceStatus";
import SettingsRow from "~/components/SettingsRow";
import { dangerouslyOverrideState } from "~/actions/settings";
import { reboot } from "~/actions/appstate";

import { INITIAL_STATE as INITIAL_SETTINGS_STATE } from "~/reducers/settings";
import { INITIAL_STATE as INITIAL_BLE_STATE } from "~/reducers/ble";

export default function Generators() {
  const dispatch = useDispatch();

  const onCallbackWithConfirmation = (callback: () => void) => {
    Confirmation.alert(
      "Destructive operation",
      "There is no coming back from this.",
      [
        {
          text: "Destroy",
          onPress: callback,
        },
        {
          text: "Cancel",
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onPress: () => {},
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  const onWipeSettings = useCallback(() => {
    onCallbackWithConfirmation(() => {
      dispatch(
        dangerouslyOverrideState({
          settings: INITIAL_SETTINGS_STATE,
        }),
      );
    });
  }, [dispatch]);

  const onWipeBLE = useCallback(() => {
    onCallbackWithConfirmation(() => {
      dispatch(
        dangerouslyOverrideState({
          ble: INITIAL_BLE_STATE,
        }),
      );
    });
  }, [dispatch]);

  const onForceRefresh = useCallback(() => {
    dispatch(reboot());
  }, [dispatch]);

  return (
    <SettingsNavigationScrollView>
      {getEnv("MOCK") ? <ToggleServiceStatusIncident /> : null}

      <Flex p={6}>
        <Alert
          type="error"
          title="The rows below perform destructive operations and should only be used if you know exactly what you're doing."
        />
      </Flex>
      <SettingsRow
        hasBorderTop
        title="Refresh?"
        desc="You may want to reload the app after wiping data"
        iconLeft={<IconsLegacy.RefreshMedium size={24} color="black" />}
        onPress={onForceRefresh}
      />
      <SettingsRow
        title="Settings"
        desc="Restores all settings to their default values"
        iconLeft={<IconsLegacy.SettingsMedium size={24} color="black" />}
        onPress={onWipeSettings}
      />
      <SettingsRow
        title="BLE devices"
        desc="Forget all seed devices"
        iconLeft={<IconsLegacy.NanoMedium size={24} color="black" />}
        onPress={onWipeBLE}
      />
    </SettingsNavigationScrollView>
  );
}
