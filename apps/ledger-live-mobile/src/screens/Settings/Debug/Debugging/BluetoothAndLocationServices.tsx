import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Flex, Alert, Switch } from "@ledgerhq/native-ui";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import RequiresBLE from "../../../../components/RequiresBLE";

/**
 * Debugging screen to test:
 * - permission of the bluetooth service
 * - reaction on enabling/disabling the bluetooth service
 * - for Android: permission of the location service
 * - for Android: reaction on enabling/disabling the location services
 */
export default function DebugBluetoothAndLocationServices() {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <Switch
          checked={openSettings}
          onChange={val => setOpenSettings(val)}
          label={
            "Open settings: on a permission denied or service disabled, go to settings and does not prompt the user"
          }
        />
        <Flex mt={5}>
          <RequiresBLE
            hasBackButtonOnError={false}
            openSettingsOnErrorButton={openSettings}
          >
            <Alert
              type="info"
              title="We have all the permissions for the services and they are enabled ✅"
            />
          </RequiresBLE>
        </Flex>
      </Flex>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
