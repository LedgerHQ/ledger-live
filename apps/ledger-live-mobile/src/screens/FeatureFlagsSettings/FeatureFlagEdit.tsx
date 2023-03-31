import React, { useCallback, useState, useMemo } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

import { BaseInput, Text, Flex, Button, Switch } from "@ledgerhq/native-ui";
import { InputRenderRightContainer } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";
import Alert from "../../components/Alert";

const FeatureFlagEdit: React.FC<{
  flagName: FeatureId;
  flagValue: Feature;
}> = props => {
  const { flagName, flagValue } = props;
  const [error, setError] = useState<Error | unknown | undefined>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  /**
   * pureValue is the value of the flag without the keys set programmatically
   * by Legder Live.
   * */
  const {
    overriddenByEnv,
    overridesRemote,
    enabledOverriddenForCurrentLanguage,
    enabledOverriddenForCurrentMobileVersion,
    ...pureValue
  } = flagValue || {};

  const stringifiedPureValue = useMemo(
    () => (pureValue ? JSON.stringify(pureValue) : undefined),
    [pureValue],
  );

  const inputValueDefaulted = inputValue || stringifiedPureValue;

  const featureFlagsProvider = useFeatureFlags();

  const { t } = useTranslation();

  const handleInputChange = useCallback(value => {
    setError(undefined);
    setInputValue(value);
  }, []);

  const handleRestoreFeature = useCallback(() => {
    setError(undefined);
    setInputValue(undefined);
    featureFlagsProvider.resetFeature(flagName);
  }, [featureFlagsProvider, flagName]);

  const handleOverrideFeature = useCallback(() => {
    setError(undefined);
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = inputValue ? JSON.parse(inputValue) : undefined;
      featureFlagsProvider.overrideFeature(flagName, newValue);
    } catch (e) {
      setError(e);
    }
  }, [inputValue, flagName, featureFlagsProvider]);

  const isChecked = useMemo(() => {
    if (!inputValueDefaulted) return false;
    try {
      return JSON.parse(inputValueDefaulted)?.enabled;
    } catch (e) {
      return false;
    }
  }, [inputValueDefaulted]);

  const handleSwitchChange = useCallback(
    enabled => {
      featureFlagsProvider.overrideFeature(flagName, { ...flagValue, enabled });
    },
    [featureFlagsProvider, flagName, flagValue],
  );

  return (
    <Flex>
      {error ? (
        <Flex mb={5}>
          <Alert type="warning">{error.toString()}</Alert>
        </Flex>
      ) : null}
      <BaseInput
        value={inputValueDefaulted}
        onChange={handleInputChange}
        renderRight={() => (
          <InputRenderRightContainer>
            <Switch checked={isChecked} onChange={handleSwitchChange} />
          </InputRenderRightContainer>
        )}
      />
      <Flex flexDirection="row" mt={3}>
        <Button size="small" type="main" outline onPress={handleRestoreFeature}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button
          size="small"
          disabled={!inputValue}
          type="main"
          onPress={handleOverrideFeature}
          ml="3"
        >
          {t("common.apply")}
        </Button>
      </Flex>
      <Flex mt={3} backgroundColor="neutral.c30">
        <ScrollView horizontal>
          <Text selectable>{JSON.stringify(pureValue, null, 2)}</Text>
        </ScrollView>
      </Flex>
    </Flex>
  );
};

export default FeatureFlagEdit;
