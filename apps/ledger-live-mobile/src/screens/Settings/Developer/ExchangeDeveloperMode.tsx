import React, { useState, useCallback, useLayoutEffect } from "react";
import { TextInput, StyleSheet, TouchableOpacity, TouchableOpacityProps, Text } from "react-native";
import { useTheme, CompositeScreenProps } from "@react-navigation/native";
import { Box } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import { ScreenName } from "~/const";
import KeyboardView from "~/components/KeyboardView";
import ImportIcon from "~/icons/Import";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import {
  setTestProviderInfo,
  getTestProviderInfo,
  removeTestProviderInfo,
} from "@ledgerhq/live-common/exchange/providers/index";
import LText from "~/components/LText";
import { useTranslation } from "react-i18next";
import Trash from "~/icons/Trash";

const DEFAULT_CAL = `{
  "name": "<name>",
  "publicKey": {
    "curve": "secp256k1",
    "data": "<data>"
  },
  "signature": "<signature>",
  "service": {
    "appVersion": 2
  }
}`;

const validateCAL = (cal: string) => {
  try {
    const validateKey = (
      obj: Record<string, string | number>,
      key: string,
      keyType: "string" | "number",
    ) => obj && obj[key] && typeof obj[key] === keyType;

    const calObj = JSON.parse(cal);
    if (
      validateKey(calObj, "name", "string") &&
      validateKey(calObj, "signature", "string") &&
      validateKey(calObj?.publicKey, "curve", "string") &&
      validateKey(calObj?.publicKey, "data", "string") &&
      validateKey(calObj?.service, "appVersion", "number")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const DebuggerButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
}> = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress}>
      <ImportIcon size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

const ApplyButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <Text>{t("common.apply")}</Text>
    </TouchableOpacity>
  );
};

type Props = CompositeScreenProps<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.ExchangeDeveloperMode>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ExchangeDeveloperMode({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [calValue, setCalValue] = useState<string | null>(null);
  const [currentCalValue, setCurrentCalValue] = useState(getTestProviderInfo());

  const refetchCurrentCalValue = useCallback(() => setCurrentCalValue(getTestProviderInfo()), []);

  const onChange = useCallback(
    (val: string) => {
      setCalValue(val);
      showError && validateCAL(val) && setShowError(false);
    },
    [showError, setCalValue],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Box flexDirection="row">
          <DebuggerButton onPress={() => onChange(JSON.stringify(JSON.parse(DEFAULT_CAL)))} />
          <ApplyButton
            disabled={calValue === null}
            onPress={() => {
              if (calValue && validateCAL(calValue)) {
                setTestProviderInfo(calValue);
                setCalValue(null);
                refetchCurrentCalValue();
              } else {
                setShowError(true);
              }
            }}
          />
        </Box>
      ),
    });
  }, [calValue, navigation, onChange, refetchCurrentCalValue]);

  return (
    <KeyboardView style={styles.root}>
      <NavigationScrollView>
        {showError && (
          <LText color={colors.warning}>
            {t("settings.developer.exchangeDeveloperMode.error")}
          </LText>
        )}
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
            },
          ]}
          value={calValue === null ? "" : calValue}
          onChangeText={onChange}
          placeholder={t("settings.developer.exchangeDeveloperMode.description")}
          multiline
          autoCorrect={false}
          scrollEnabled={false}
        />
        <Text>
          {t("settings.developer.exchangeDeveloperMode.currentSetting")}
          <>
            {currentCalValue && (
              <TouchableOpacity
                style={styles.buttonBox}
                onPress={() => {
                  removeTestProviderInfo();
                  refetchCurrentCalValue();
                }}
              >
                <Trash size={18} color={colors.black} />
              </TouchableOpacity>
            )}
          </>
        </Text>
        <>{currentCalValue && <Text>{JSON.stringify(currentCalValue, null, 2)}</Text>}</>
      </NavigationScrollView>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  buttonBox: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  appCardBox: {
    flex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginBottom: 16,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
