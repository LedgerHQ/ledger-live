import React, { useState, useCallback } from "react";
import { firstValueFrom, of } from "rxjs";
import { StyleSheet, ScrollView } from "react-native";
import { Flex, Button, Alert, Tag } from "@ledgerhq/native-ui";

import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import quitApp from "@ledgerhq/live-common/hw/quitApp";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import getDeviceName from "@ledgerhq/live-common/hw/getDeviceName";
import getBatteryStatus from "@ledgerhq/live-common/hw/getBatteryStatus";
import listApps from "@ledgerhq/live-common/hw/listApps";
import Transport from "@ledgerhq/hw-transport";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

import NavigationScrollView from "~/components/NavigationScrollView";
import LText from "~/components/LText";
import QueuedDrawer from "~/components/QueuedDrawer";

const commandsById: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (transport: Transport, ...args: any[]) => unknown;
} = {
  getDeviceInfo,
  quitApp,
  getAppAndVersion,
  getDeviceName,
  getBatteryStatus,
  listApps,
};

type Props = StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugCommandSender>;

const CommandSender = ({ route }: Props) => {
  const { params } = route || {};
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [result, setResult] = useState<unknown | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const onCommandSend = useCallback(
    (id: keyof typeof commandsById) => {
      const { deviceId } = params;
      if (!deviceId) return;

      const runCommand = async () => {
        firstValueFrom(
          withDevice(deviceId)(transport => {
            setRunning(true);
            return of(commandsById[id](transport));
          }),
        )
          .then(result => {
            setResult(result ?? "No output");
          })
          .catch(e => setResult(e))
          .finally(() => {
            setRunning(false);
          });
      };
      runCommand();
    },
    [params],
  );
  // TODO introduce some sort of logs viewer like from the BLE debug or Logs screens.

  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <Alert type="info" title="Run commands on the selected device and get the output if any." />
        <Flex flex={1} mt={4}>
          <Tag type={running ? "color" : "shade"}>{running ? "Running" : "Not running"}</Tag>
        </Flex>
        <Flex flex={1} mt={4}>
          {result ? <LText monospace>{JSON.stringify(result, undefined, 4)} </LText> : null}
        </Flex>
        {!modalVisible ? (
          <Button
            type="main"
            mt={4}
            onPress={() => {
              setModalVisible(true);
            }}
          >
            {"Show commands"}
          </Button>
        ) : null}
        <QueuedDrawer isRequestingToBeOpened={modalVisible} onClose={setModalVisible as () => void}>
          <ScrollView>
            {Object.keys(commandsById).map((key, i) => (
              <Button
                type="shade"
                mb={3}
                key={key + i}
                onPress={() => {
                  onCommandSend(key);
                  setModalVisible(false);
                }}
              >
                {key}
              </Button>
            ))}
          </ScrollView>
        </QueuedDrawer>
      </Flex>
    </NavigationScrollView>
  );
};

export default CommandSender;

const styles = StyleSheet.create({
  root: {
    padding: 16,
    flex: 1,
  },
});
