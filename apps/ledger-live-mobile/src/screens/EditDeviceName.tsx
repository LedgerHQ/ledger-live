import React, { memo, useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans, useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { Button, Text, Icons, Flex } from "@ledgerhq/native-ui";
import { createAction } from "@ledgerhq/live-common/hw/actions/renameDevice";
import renameDevice from "@ledgerhq/live-common/hw/renameDevice";
import getDeviceNameMaxLength from "@ledgerhq/live-common/hw/getDeviceNameMaxLength";
import { TrackScreen } from "../analytics";
import KeyboardBackgroundDismiss from "../components/KeyboardBackgroundDismiss";
import TextInput from "../components/TextInput";
import TranslatedError from "../components/TranslatedError";
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
import { BleSaveDeviceNamePayload } from "../actions/types";

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
  saveBleDeviceName: ({ deviceId, name }: BleSaveDeviceNamePayload) => void;
} & NavigationProps;

function EditDeviceName({ navigation, route, saveBleDeviceName }: Props) {
  const originalName = route.params?.deviceName;
  const device = route.params?.device;
  const deviceInfo = route.params?.deviceInfo;

  const { t } = useTranslation();
  const { pushToast } = useToasts();

  const maxDeviceName = useMemo(
    () =>
      getDeviceNameMaxLength({
        deviceModelId: device.modelId,
        version: deviceInfo.version,
      }),
    [device.modelId, deviceInfo.version],
  );

  const [name, setName] = useState<string>(
    originalName.slice(0, maxDeviceName),
  );
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined | null>(null);
  const [running, setRunning] = useState(false);
  const request = useMemo(() => ({ name }), [name]);

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
    setRunning(true);
    if (originalName !== name) {
      setName(name.trim());
    } else {
      navigation.goBack();
    }
  }, [name, navigation, originalName]);

  const onSuccess = useCallback(() => {
    setCompleted(true);
    setRunning(false);
    saveBleDeviceName({ deviceId: device.deviceId, name });

    pushToast({
      id: "rename-device-success",
      type: "success",
      icon: "success",
      title: t("EditDeviceName.success", { deviceName: name }),
    });

    navigation.goBack();
  }, [device.deviceId, name, navigation, pushToast, saveBleDeviceName, t]);

  const onClose = useCallback(() => {
    if (completed) {
      navigation.goBack();
    } else {
      setRunning(false);
    }
  }, [completed, navigation]);

  const remainingCount = maxDeviceName - name.length;
  const cleanName = name.trim();
  const disabled =
    !cleanName || !!error || running || cleanName === originalName;

  return (
    <KeyboardBackgroundDismiss>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardView style={{ flex: 1 }}>
          <TrackScreen category="EditDeviceName" />
          <Flex flex={1} p={6} bg="background.main">
            <TextInput
              value={name}
              onChangeText={onChangeText}
              maxLength={maxDeviceName}
              autoFocus
              selectTextOnFocus
              blurOnSubmit={true}
              clearButtonMode="always"
              placeholder="Satoshi Nakamoto"
            />

            {error ? (
              <Flex alignItems={"center"} flexDirection={"row"} mt={1}>
                <Icons.WarningMedium color="error.c50" size={16} />
                <Text
                  variant="small"
                  color="error.c50"
                  ml={2}
                  numberOfLines={2}
                >
                  <TranslatedError error={error} />
                </Text>
              </Flex>
            ) : (
              <Text variant="small" color="neutral.c80" mt={1}>
                <Trans
                  i18nKey="EditDeviceName.charactersRemaining"
                  values={{ remainingCount }}
                />
              </Text>
            )}

            <Button type="main" onPress={onSubmit} mt={5} disabled={disabled}>
              <Trans i18nKey="EditDeviceName.action" />
            </Button>
          </Flex>

          {running ? (
            <DeviceActionModal
              device={device}
              request={request}
              action={action}
              onClose={onClose}
              onResult={onSuccess}
            />
          ) : null}
        </KeyboardView>
      </SafeAreaView>
    </KeyboardBackgroundDismiss>
  );
}

const m = connect(null, mapDispatchToProps)(EditDeviceName);

export default memo<NavigationProps>(m);
