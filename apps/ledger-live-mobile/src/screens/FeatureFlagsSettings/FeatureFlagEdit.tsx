import React, { useCallback, useState, useMemo, useEffect } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

import { Text, Flex, Button, Switch } from "@ledgerhq/native-ui";
import { InputRenderRightContainer } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";
import { TextInput } from "react-native";
import { useTheme } from "styled-components/native";

const formatValue = (value: Feature) => {
  return JSON.stringify(value, null, 2);
};

const FeatureFlagEdit: React.FC<{
  flagName: FeatureId;
  flagValue: Feature;
}> = props => {
  const { colors } = useTheme();
  const featureFlagsProvider = useFeatureFlags();
  const { t } = useTranslation();
  const { flagName, flagValue } = props;
  const [error, setError] = useState<Error | unknown | undefined>();

  /**
   * pureValue is the value of the flag without the keys set programmatically
   * by Legder Live.
   * */
  const {
    overriddenByEnv,
    overridesRemote,
    enabledOverriddenForCurrentLanguage,
    enabledOverriddenForCurrentVersion,
    ...pureValue
  } = flagValue || {};

  const [featureFlagValue, setFeatureFlagValue] = useState<Feature>(pureValue);
  const [inputValueStringified, setInputValueStringified] = useState(formatValue(pureValue));

  useEffect(() => {
    if (formatValue(pureValue) !== formatValue(featureFlagValue)) {
      setFeatureFlagValue(pureValue);
      setInputValueStringified(formatValue(pureValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pureValue]);

  const handleInputChange = (value: string) => {
    try {
      setInputValueStringified(value);
      // If value is invalid or missing, JSON parse will fail and error will be set
      JSON.parse(value);
      setError(undefined);
    } catch (err) {
      setError("Bad Format");
    }
  };

  const handleRestoreFeature = useCallback(() => {
    setError(undefined);
    featureFlagsProvider.resetFeature(flagName);
  }, [featureFlagsProvider, flagName]);

  const handleOverrideFeature = useCallback(() => {
    setError(undefined);
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = inputValueStringified ? JSON.parse(inputValueStringified) : undefined;
      setFeatureFlagValue(newValue);
      featureFlagsProvider.overrideFeature(flagName, newValue);
    } catch (e) {
      setError(e);
    }
  }, [inputValueStringified, flagName, featureFlagsProvider]);

  const isChecked = useMemo(() => {
    if (!featureFlagValue) return false;
    try {
      return featureFlagValue?.enabled;
    } catch (e) {
      return false;
    }
  }, [featureFlagValue]);

  const handleSwitchChange = useCallback(
    (enabled: boolean) => {
      const newValue = { ...featureFlagValue, enabled };
      setFeatureFlagValue(newValue);
      setInputValueStringified(formatValue(newValue));
      featureFlagsProvider.overrideFeature(flagName, newValue);
    },
    [featureFlagsProvider, flagName, featureFlagValue],
  );

  return (
    <Flex>
      <Text mb={2}>Edit here :</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: error ? colors.error.c60 : colors.primary.c80,
          borderRadius: 8,
          padding: 4,
          backgroundColor: colors.neutral.c30,
          color: colors.neutral.c100,
        }}
        value={inputValueStringified}
        onChangeText={handleInputChange}
        multiline={true}
        underlineColorAndroid="transparent"
      />
      {error ? (
        <Flex mt={2}>
          <Text color="error.c60">Error : {error.toString()}</Text>
        </Flex>
      ) : null}
      <Flex flexDirection="row" mt={3}>
        <InputRenderRightContainer>
          <Switch checked={isChecked} onChange={handleSwitchChange} />
        </InputRenderRightContainer>
        <Button size="small" type="main" outline onPress={handleRestoreFeature}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button
          size="small"
          disabled={
            !!error || !inputValueStringified || inputValueStringified === formatValue(pureValue)
          }
          type="main"
          onPress={handleOverrideFeature}
          ml="3"
        >
          {t("common.apply")}
        </Button>
      </Flex>
      <Text mt={2}>Current value :</Text>
      <Flex mt={2} backgroundColor="neutral.c30" p={2}>
        <ScrollView horizontal>
          <Text selectable>{formatValue(pureValue)}</Text>
        </ScrollView>
      </Flex>
    </Flex>
  );
};

export default FeatureFlagEdit;
