import React, { useState, useMemo, useCallback } from "react";
import Button from "~/renderer/components/ButtonV3";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Text, Input, Flex, Switch } from "@ledgerhq/react-ui";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { InputRenderRightContainer } from "@ledgerhq/react-ui/components/form/BaseInput/index";
import Alert from "~/renderer/components/Alert";

const FeatureFlagEdit: React.FC<{ flagName: FeatureId; flagValue: Feature }> = props => {
  const { flagName, flagValue } = props;
  const [error, setError] = useState<Error | unknown | undefined>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  /**
   * pureValue is the value of the flag without the keys set programmatically
   * by Legder Live.
   * */
  const {
    overriddenByEnv, // eslint-disable-line @typescript-eslint/no-unused-vars
    overridesRemote, // eslint-disable-line @typescript-eslint/no-unused-vars
    enabledOverriddenForCurrentLanguage, // eslint-disable-line @typescript-eslint/no-unused-vars
    enabledOverriddenForCurrentVersion, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...pureValue
  } = flagValue || {};

  const stringifiedPureValue = useMemo(
    () => (pureValue ? JSON.stringify(pureValue) : undefined),
    [pureValue],
  );

  const inputValueDefaulted = inputValue || stringifiedPureValue;

  const featureFlagsProvider = useFeatureFlags();

  const { t } = useTranslation();

  const handleInputChange = useCallback((value?: string) => {
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

  const handleSwitchChange = useCallback(() => {
    featureFlagsProvider.overrideFeature(flagName, { ...flagValue, enabled: !isChecked });
  }, [featureFlagsProvider, flagName, flagValue, isChecked]);

  return (
    <Flex flexDirection="column" pl={6} rowGap={3}>
      <Flex flex={1} flexDirection="row" alignItems={"center"} columnGap={2}>
        {error ? (
          <Alert mb={3} type="warning">
            {error.toString()}
          </Alert>
        ) : null}
        <Flex flex={1} flexDirection="column">
          <Input
            value={inputValueDefaulted}
            onChange={handleInputChange}
            renderRight={() => (
              <InputRenderRightContainer>
                <Switch name="toggle" checked={isChecked} onChange={handleSwitchChange} />
              </InputRenderRightContainer>
            )}
          />
        </Flex>
        <Button variant="main" outline onClick={handleRestoreFeature}>
          {t("settings.developer.featureFlagsRestore")}
        </Button>
        <Button disabled={!inputValue} variant="main" onClick={handleOverrideFeature}>
          {t("settings.developer.featureFlagsOverride")}
        </Button>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c30" overflowX={"scroll"}>
        <Text whiteSpace="pre">{JSON.stringify(pureValue, null, 2)}</Text>
      </Flex>
    </Flex>
  );
};

export default FeatureFlagEdit;
