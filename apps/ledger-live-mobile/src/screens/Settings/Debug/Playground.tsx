import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Flex, Alert, Text } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import Button from "~/components/Button";
import {
  DeviceNotRecognizedError,
  DeviceAlreadyConnectedError,
  UnknownDeviceError,
  AlreadySendingApduError,
  UnknownDeviceExchangeError,
  SendApduTimeoutError,
} from "@ledgerhq/device-management-kit";
import { useTrackDmkErrorsEvents } from "~/analytics/hooks/useTrackDmkErrorsEvents";

export default function DebugPlayground() {
  const errors = useMemo(
    () => [
      new DeviceNotRecognizedError(),
      new DeviceAlreadyConnectedError(),
      new UnknownDeviceError(),
      new AlreadySendingApduError(),
      new UnknownDeviceExchangeError(),
      new SendApduTimeoutError(),
      {
        _tag: "ReceiverApduError",
      },
      {
        _tag: "FramerApduError",
      },
    ],
    [],
  );
  const [currentErrorIndex, setCurrentErrorIndex] = React.useState(-1);
  useTrackDmkErrorsEvents({ error: errors[currentErrorIndex] });
  const onPress = useCallback(() => {
    if (currentErrorIndex + 1 < errors.length) {
      setCurrentErrorIndex(currentErrorIndex + 1);
    }
  }, [currentErrorIndex, errors]);
  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <Text>{errors[currentErrorIndex] ? errors[currentErrorIndex]._tag : ""}</Text>
        <Alert
          type="info"
          title="Convenience screen for testing purposes, please leave empty when committing."
        />
        <Button mt={4} type={"primary"} event={""} onPress={onPress} title={"Action"} />
      </Flex>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
