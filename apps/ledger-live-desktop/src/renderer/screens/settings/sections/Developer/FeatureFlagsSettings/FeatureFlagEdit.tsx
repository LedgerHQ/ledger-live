import React, { useState, useMemo, useCallback } from "react";
import Button from "~/renderer/components/ButtonV3";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Text, Input, Flex } from "@ledgerhq/react-ui";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { InputRenderRightContainer } from "@ledgerhq/react-ui/components/form/BaseInput/index";
import { withV2StyleProvider } from "~/renderer/styles/StyleProvider";
import SwitchV2 from "~/renderer/components/Switch";
import Alert from "~/renderer/components/Alert";

const Switch = withV2StyleProvider(SwitchV2);

const FeatureFlagEdit: React.FC<{ flagName: FeatureId; flagValue: Feature }> = props => {
  const { flagName, flagValue } = props;
  const [error, setError] = useState<Error | unknown | undefined>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const stringifiedFlagValue = useMemo(() => (flagValue ? JSON.stringify(flagValue) : undefined), [
    flagValue,
  ]);
  const inputValueDefaulted = inputValue || stringifiedFlagValue;

  const { overriddenByEnv, overridesRemote, enabledOverriddenForCurrentLanguage, ...pureValue } = // eslint-disable-line
    flagValue || {};

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
                <Switch isChecked={isChecked} onChange={handleSwitchChange} />
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

      <Flex p={3} backgroundColor="neutral.c30">
        <Text whiteSpace="pre">{JSON.stringify(pureValue, null, 2)}</Text>
      </Flex>
    </Flex>
  );
};

export default FeatureFlagEdit;
