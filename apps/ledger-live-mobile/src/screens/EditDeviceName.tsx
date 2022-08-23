// @flow

import React, { memo, useCallback, useState } from "react";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import { Text, Icons, Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "../analytics";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import TranslatedError from "../components/TranslatedError";
import { editDeviceName, connectingStep } from "../components/DeviceJob/steps";
import DeviceJob from "../components/DeviceJob";
import KeyboardView from "../components/KeyboardView";
import { saveBleDeviceName } from "../actions/ble";

const MAX_DEVICE_NAME = 20;

function FooterError({ error }: { error: Error }) {
  return (
    <Text variant="body" color="error.c100" numberOfLines={2}>
      <Icons.WarningMedium color="error.c100" size={16} />
      <TranslatedError error={error} />
    </Text>
  );
}
const mapDispatchToProps = {
  saveBleDeviceName,
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
  saveBleDeviceName: (d: string, v: string) => void;
};

type RouteParams = {
  deviceId: string;
  deviceName: string;
};

function EditDeviceName({ navigation, route, saveBleDeviceName }: Props) {
  const [name, setName] = useState<string>(route.params?.deviceName);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(null);

  const validate = useCallback(
    n => {
      const invalidCharacters = n.replace(/[\x00-\x7F]*/g, "");
      setError(
        invalidCharacters
          ? new DeviceNameInvalid("", { invalidCharacters })
          : undefined,
      );
    },
    [setError],
  );

  const onChangeText = useCallback(
    (name: string) => {
      setName(name);
      validate(name);
    },
    [validate],
  );

  const onInputCleared = useCallback(() => {
    setName("");
  }, []);

  const onSubmit = useCallback(async () => {
    if (route.params?.deviceName !== name) {
      setTimeout(() => {
        setName(name.trim());
        setConnecting({
          deviceId: route.params?.deviceId,
          deviceName: name.trim(),
          modelId: "nanoX",
          wired: false,
        });
      }, 800);
    } else {
      navigation.goBack();
    }
  }, [name, navigation, route.params?.deviceId, route.params?.deviceName]);

  const onCancel = useCallback(() => {
    setConnecting(null);
  }, []);

  const onDone = useCallback(() => {
    saveBleDeviceName(route.params?.deviceId, name);
    navigation.goBack();
  }, [saveBleDeviceName, route.params?.deviceId, name, navigation]);

  const remainingCount = MAX_DEVICE_NAME - name.length;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardView style={{ flex: 1 }}>
        <TrackScreen category="EditDeviceName" />
        <Flex flex={1} p={6} bg="background.main">
          <TextInput
            value={name}
            onChangeText={onChangeText}
            onInputCleared={onInputCleared}
            maxLength={MAX_DEVICE_NAME}
            autoFocus
            selectTextOnFocus
            blurOnSubmit={false}
            clearButtonMode="always"
            placeholder="Satoshi Nakamoto"
          />
          <Text variant="small" color="neutral.c80">
            <Trans
              i18nKey="EditDeviceName.charactersRemaining"
              values={{ remainingCount }}
            />
          </Text>
          <Flex flex={1} />

          {error ? <FooterError error={error} /> : null}
          <Button
            event="EditDeviceNameSubmit"
            type="main"
            title={<Trans i18nKey="EditDeviceName.action" />}
            onPress={onSubmit}
            disabled={!name.trim() || !!error}
          />
        </Flex>

        <DeviceJob
          deviceModelId="nanoX" // NB: EditDeviceName feature is only available on NanoX over BLE.
          meta={connecting}
          onCancel={onCancel}
          onDone={onDone}
          steps={[connectingStep, editDeviceName(name)]}
        />
      </KeyboardView>
    </SafeAreaView>
  );
}

const m = connect(null, mapDispatchToProps)(EditDeviceName);

export default memo<Props>(m);
