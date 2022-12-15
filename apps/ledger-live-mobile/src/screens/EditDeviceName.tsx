import React, { memo, useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import { Text, Icons, Flex } from "@ledgerhq/native-ui";
import { createAction } from "@ledgerhq/live-common/hw/actions/renameDevice";
import renameDevice from "@ledgerhq/live-common/hw/renameDevice";
import { TrackScreen } from "../analytics";
import Button from "../components/Button";
import KeyboardBackgroundDismiss from "../components/KeyboardBackgroundDismiss";
import TextInput from "../components/TextInput";
import TranslatedError from "../components/TranslatedError";
import DeviceRenamed from "../components/DeviceRenamed";
import DeviceActionModal from "../components/DeviceActionModal";
import KeyboardView from "../components/KeyboardView";
import { saveBleDeviceName } from "../actions/ble";
import {
  RootComposite,
  StackNavigatorProps,
} from "../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../const";
import { BaseOnboardingNavigatorParamList } from "../components/RootNavigator/types/BaseOnboardingNavigator";

const MAX_DEVICE_NAME = 20;
const action = createAction(renameDevice);

const mapDispatchToProps = {
  saveBleDeviceName,
};

type NavigationProps = RootComposite<
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.EditDeviceName>
  | StackNavigatorProps<
      BaseOnboardingNavigatorParamList,
      ScreenName.EditDeviceName
    >
>;
type Props = {
  saveBleDeviceName: (d: string, v: string) => void;
} & NavigationProps;

function EditDeviceName({ navigation, route, saveBleDeviceName }: Props) {
  const originalName = route.params?.deviceName;
  const device = route.params?.device;

  const [name, setName] = useState<string>(originalName);
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined | null>(null);
  const [connecting, setConnecting] = useState(false);

  const onChangeText = useCallback((name: string) => {
    // Nb mobile devices tend to use U+2018 for single quote, not supported
    // by our firmware, replacing it a U+0027. Same for U+201C,U+201D,...
    // TODO when we offer device rename on LLD, move this logic to common.
    const sanitizedName = name.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
    const invalidCharacters = sanitizedName.replace(/[\x00-\x7F]*/g, "");
    const maybeError = invalidCharacters
      ? new DeviceNameInvalid("", { invalidCharacters })
      : undefined;

    setError(maybeError);
    setName(sanitizedName);
  }, []);

  const onSubmit = useCallback(async () => {
    if (originalName !== name) {
      setTimeout(() => {
        setName(name.trim());
        setConnecting(true);
      }, 800);
    } else {
      navigation.goBack();
    }
  }, [name, navigation, originalName]);

  const onSuccess = useCallback(() => {
    setCompleted(true);
    saveBleDeviceName(device.deviceId, name);
  }, [device.deviceId, name, saveBleDeviceName]);

  const onClose = useCallback(() => {
    if (completed) {
      navigation.goBack();
    } else {
      setConnecting(false);
    }
  }, [completed, navigation]);

  const remainingCount = MAX_DEVICE_NAME - name.length;

  return (
    <KeyboardBackgroundDismiss>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardView style={{ flex: 1 }}>
          <TrackScreen category="EditDeviceName" />
          <Flex flex={1} p={6} bg="background.main">
            <TextInput
              value={name}
              onChangeText={onChangeText}
              maxLength={MAX_DEVICE_NAME}
              autoFocus
              selectTextOnFocus
              blurOnSubmit={true}
              clearButtonMode="always"
              placeholder="Satoshi Nakamoto"
            />
            <Text variant="small" color="neutral.c80">
              <Trans
                i18nKey="EditDeviceName.charactersRemaining"
                values={{ remainingCount }}
              />
            </Text>

            {error ? (
              <Text variant="body" color="error.c100" numberOfLines={2}>
                <Icons.WarningMedium color="error.c100" size={16} />
                <TranslatedError error={error} />
              </Text>
            ) : null}

            <Button
              event="EditDeviceNameSubmit"
              type="main"
              title={<Trans i18nKey="EditDeviceName.action" />}
              onPress={onSubmit}
              mt={5}
              disabled={!name.trim() || !!error}
            />
          </Flex>

          {connecting ? (
            <DeviceActionModal
              device={device}
              request={name}
              action={action}
              onClose={onClose}
              renderOnResult={deviceName => (
                <DeviceRenamed
                  onContinue={onClose}
                  onMount={onSuccess}
                  deviceName={deviceName}
                />
              )}
            />
          ) : null}
        </KeyboardView>
      </SafeAreaView>
    </KeyboardBackgroundDismiss>
  );
}

const m = connect(null, mapDispatchToProps)(EditDeviceName);

export default memo<NavigationProps>(m);
