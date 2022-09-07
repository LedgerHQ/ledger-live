import React, { useState, useMemo, useCallback } from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { defaultFeatures, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Alert from "~/renderer/components/Alert";
import styled from "styled-components";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

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
    <Box p={3}>
      {error ? (
        <Alert mb={3} type="warning">
          {error.toString()}
        </Alert>
      ) : null}
      <Input value={value} onChange={onChange} />
      <Box mt={3} horizontal justifyContent="flex-end">
        <Button small onClick={onRestore}>
          {t("settings.developer.featureFlagsRestore")}
        </Button>
        <Button disabled={disabled} small primary onClick={onOverride} style={{ marginLeft: 8 }}>
          {t("settings.developer.featureFlagsOverride")}
        </Button>
      </Box>
    </Box>
  );
};

const FeatureFlagsButton = () => {
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
    <>
      <Row
        title={t("settings.developer.featureFlagsTitle")}
        desc={t("settings.developer.featureFlagsDesc")}
      />
      <Box pt={2}>
        {Object.entries(featureFlags).map(([flagName, value]) => (
          <>
            <Box horizontal px={4} py={1}>
              <Box grow flex={1} mr={3}>
                <Box ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14} mb={2}>
                  {value?.overridesRemote ? `${flagName} **` : flagName}
                </Box>
              </Box>
              <ButtonContainer>
                {name !== flagName ? (
                  <Button
                    small
                    onClick={() => {
                      setName(flagName);
                    }}
                  >
                    {t("settings.developer.featureFlagsEdit")}
                  </Button>
                ) : null}
              </ButtonContainer>
            </Box>
            {name === flagName ? (
              <EditSection
                value={inputValues[flagName] || JSON.stringify(featureFlags[flagName])}
                disabled={!inputValues[flagName]}
                error={error}
                onChange={handleInputChange}
                onOverride={handleOverrideFeature}
                onRestore={handleRestoreFeature}
              />
            ) : null}
          </>
        ))}
      </Box>
    </>
  );
};

export default FeatureFlagsButton;
