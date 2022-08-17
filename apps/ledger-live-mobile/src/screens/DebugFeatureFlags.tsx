import React, { useCallback, useState, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  defaultFeatures,
  useFeatureFlags,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

import { BaseInput, Text, Flex, Button, Box } from "@ledgerhq/native-ui";
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
          ml="3"
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
  const [error, setError] = useState<unknown | null>(null);
  const [name, setName] = useState<FeatureId | null>(null);
  const [prettyPrintedName, setPrettyPrintedName] = useState<FeatureId | null>(null);
  const [inputValues, setInputValues] = useState<{[key in FeatureId]?: string | undefined}>({});

  const featureFlags = useMemo(() => {
    const features: {[key in FeatureId]: Feature} = {};
    Object.keys(defaultFeatures).forEach((key: FeatureId) => {
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
      setError(null);
      if (!name) return;
      setInputValues(currentValues => ({
        ...currentValues,
        [name]: value,
      }));
    },
    [name],
  );

  const handleRestoreFeature = useCallback(() => {
    setError(null);
    if (!name) return;
    setInputValues(currentValues => ({
      ...currentValues,
      [name]: undefined,
    }));
    featureFlagsProvider.resetFeature(name);
    setName(null);
  }, [featureFlagsProvider, name]);

  const handleOverrideFeature = useCallback(() => {
    setError(null);
    if (!name) return;
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = JSON.parse(inputValues[name]);
      featureFlagsProvider.overrideFeature(name, newValue);
      setName(null);
    } catch (e) {
      setError(e);
    }
  }, [inputValues, name, featureFlagsProvider]);

  return (
    <NavigationScrollView>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text variant="large" color="neutral.c70">
          {t("settings.debug.featureFlagsTitle")}
        </Text>
        {Object.entries(featureFlags).map(([flagName, value], index, arr) => (
          <View key={flagName}>
            <Flex flexDirection="column" py={1}>
              <Text>
                {value?.overridesRemote ? `${flagName} **` : flagName}
              </Text>
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
                error={error as Error}
                onChange={handleInputChange}
                onOverride={handleOverrideFeature}
                onRestore={handleRestoreFeature}
              />
            ) : null}
            {prettyPrintedName !== flagName ? (
              <Button
                type="main"
                outline
                onPress={() => setPrettyPrintedName(flagName)}
              >
                {t("settings.debug.featureFlagsDisplayValue")}
              </Button>
            ) : (
              <Button
                type="main"
                outline
                onPress={() => setPrettyPrintedName("")}
              >
                {t("settings.debug.featureFlagsHideValue")}
              </Button>
            )}
            {prettyPrintedName === flagName && (
              <Flex backgroundColor="neutral.c30">
                <ScrollView horizontal>
                  <Text>{JSON.stringify(featureFlags[flagName], null, 2)}</Text>
                </ScrollView>
              </Flex>
            )}
            {index < arr.length - 1 && (
              <Box
                my={4}
                width="100%"
                height={1}
                backgroundColor="neutral.c50"
              />
            )}
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
