import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  defaultFeatures,
  useFeatureFlags,
} from "@ledgerhq/live-common/featureFlags/index";

import { BaseInput, Text, Flex, Button } from "@ledgerhq/native-ui";
import NavigationScrollView from "../components/NavigationScrollView";
import Alert from "../components/Alert";

type EditSectionProps = {
  error?: Error;
  value: string;
  disabled?: boolean;

  onOverride: () => void;
  onRestore: () => void;
  onChange: (_: string) => void;
};

const EditSection = ({
  error,
  value,
  onOverride,
  onRestore,
  onChange,
  disabled,
}: EditSectionProps) => {
  const { t } = useTranslation();
  return (
    <Flex p={3}>
      {error ? (
        <Flex mb={5}>
          <Alert type="warning">{error.toString()}</Alert>
        </Flex>
      ) : null}
      <BaseInput value={value} onChange={onChange} />
      <Flex flexDirection="row" mt={3}>
        <Button onPress={onRestore}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button
          disabled={disabled}
          type="main"
          onPress={onOverride}
          style={{ marginLeft: 8 }}
        >
          {t("settings.debug.featureFlagsOverride")}
        </Button>
      </Flex>
    </Flex>
  );
};
export default function DebugPlayground() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();
  const [error, setError] = useState();
  const [name, setName] = useState();
  const [inputValues, setInputValues] = useState({});

  const featureFlags = useMemo(() => {
    const features = {};
    Object.keys(defaultFeatures).forEach(key => {
      const value = featureFlagsProvider.getFeature(key);
      if (value) {
        features[key] = value;
      }
    });
    return features;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, featureFlagsProvider]);

  const handleInputChange = useCallback(
    value => {
      setError();
      setInputValues(currentValues => ({
        ...currentValues,
        [name]: value,
      }));
    },
    [name],
  );

  const handleRestoreFeature = useCallback(() => {
    setError();
    setInputValues(currentValues => ({
      ...currentValues,
      [name]: undefined,
    }));
    featureFlagsProvider.resetFeature(name);
    setName();
  }, [featureFlagsProvider, name]);

  const handleOverrideFeature = useCallback(() => {
    setError();
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = JSON.parse(inputValues[name]);
      featureFlagsProvider.overrideFeature(name, newValue);
      setName();
    } catch (e) {
      setError(e);
    }
  }, [inputValues, name, featureFlagsProvider]);

  return (
    <NavigationScrollView>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text>{t("settings.debug.featureFlagsTitle")}</Text>
        {Object.entries(featureFlags).map(([flagName, value]) => (
          <View key={flagName}>
            <Flex flexDirection="column" px={4} py={1}>
              <View grow flex={1} mr={3}>
                <View
                  ff="Inter|SemiBold"
                  color="palette.text.shade100"
                  fontSize={14}
                  mb={2}
                >
                  <Text>
                    {value?.overridesRemote ? `${flagName} **` : flagName}
                  </Text>
                </View>
              </View>
              {name !== flagName ? (
                <Button
                  type="main"
                  onPress={() => {
                    setName(flagName);
                  }}
                >
                  {t("settings.debug.featureFlagsEdit")}
                </Button>
              ) : null}
            </Flex>
            {name === flagName ? (
              <EditSection
                value={
                  inputValues[flagName] ||
                  JSON.stringify(featureFlags[flagName])
                }
                disabled={!inputValues[flagName]}
                error={error}
                onChange={handleInputChange}
                onOverride={handleOverrideFeature}
                onRestore={handleRestoreFeature}
              />
            ) : null}
          </View>
        ))}
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
