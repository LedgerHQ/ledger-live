import React, { useState, useMemo, useCallback } from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { defaultFeatures, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { Text, Input, Icons, Flex, Tag, SearchInput } from "@ledgerhq/react-ui";
import {
  InputRenderLeftContainer,
  InputRenderRightContainer,
} from "@ledgerhq/react-ui/components/form/BaseInput/index";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { includes, lowerCase } from "lodash";
import Box from "~/renderer/components/Box";
import Switch from "~/renderer/components/Switch";
import Alert from "~/renderer/components/Alert";
import { Feature, FeatureId } from "@ledgerhq/types-live";

type EditSectionProps = {
  error?: Error;
  value: string;
  disabled?: boolean;

  onOverride: () => void;
  onRestore: () => void;
  onChange: (_: string) => void;
};

const tryParse = (jsonString: string, fallback: any) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
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
  const handleSwitchChange = useCallback(
    enabled => {
      const prevVal = JSON.parse(value);
      onChange(JSON.stringify({ ...prevVal, enabled }));
    },
    [value, onChange],
  );
  return (
    <Flex flex={1} flexDirection="row" alignItems={"center"} columnGap={2}>
      {error ? (
        <Alert mb={3} type="warning">
          {error.toString()}
        </Alert>
      ) : null}
      <Flex flex={1} flexDirection="column">
        <Input
          value={value}
          onChange={onChange}
          renderRight={() => (
            <InputRenderRightContainer>
              <Switch isChecked={tryParse(value, false)?.enabled} onChange={handleSwitchChange} />
            </InputRenderRightContainer>
          )}
        />
      </Flex>
      <Button small outlineGrey onClick={onRestore}>
        {t("settings.developer.featureFlagsRestore")}
      </Button>
      <Button disabled={disabled} small primary onClick={onOverride}>
        {t("settings.developer.featureFlagsOverride")}
      </Button>
    </Flex>
  );
};

const FeatureFlagsButton = () => {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState();
  const [focusedName, setFocusedName] = useState<string | undefined>("");
  const [hiddenFlagName, setHiddenFlagName] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<
    {
      [key in FeatureId | string]?: string | undefined;
    }
  >({});
  const [searchInput, setSearchInput] = useState("");

  const featureFlags = useMemo(() => {
    const features: { [key in FeatureId | string]: Feature } = {};
    const featureKeys = Object.keys(defaultFeatures);
    if (hiddenFlagName && !featureKeys.includes(hiddenFlagName)) featureKeys.push(hiddenFlagName);
    featureKeys.forEach((key: FeatureId | string) => {
      const value = featureFlagsProvider.getFeature(key as FeatureId);
      if (value) {
        features[key] = value;
      }
    });
    return features;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedName, featureFlagsProvider, hiddenFlagName]);

  const handleInputChange = useCallback(
    value => {
      setError();
      setInputValues(currentValues => ({
        ...currentValues,
        [focusedName]: value,
      }));
    },
    [focusedName],
  );

  const handleRestoreFeature = useCallback(() => {
    setError();
    setInputValues(currentValues => ({
      ...currentValues,
      [focusedName]: undefined,
    }));
    featureFlagsProvider.resetFeature(focusedName);
  }, [featureFlagsProvider, focusedName]);

  const handleOverrideFeature = useCallback(() => {
    setError();
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = JSON.parse(inputValues[focusedName]);
      featureFlagsProvider.overrideFeature(focusedName, newValue);
    } catch (e) {
      setError(e);
    }
  }, [inputValues, focusedName, featureFlagsProvider]);

  const handleAddHiddenFlag = useCallback(
    value => {
      setHiddenFlagName(value);
      setSearchInput(value);
    },
    [setSearchInput, setHiddenFlagName],
  );

  const filteredFlags = useMemo(() => {
    return Object.entries(featureFlags)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(([name]) => !searchInput || includes(lowerCase(name), lowerCase(searchInput)));
  }, [featureFlags, searchInput]);

  return (
    <Row
      title={t("settings.developer.featureFlagsTitle")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: visible ? "flex-start" : "center" }}
      desc={
        <Flex flexDirection="column" pt={2} rowGap={1} alignSelf="stretch">
          {t("settings.developer.featureFlagsDesc")}
          {!visible ? null : (
            <>
              <SearchInput
                placeholder="Search"
                value={searchInput}
                onChange={setSearchInput}
                clearable
              />
              <Input
                renderLeft={() => (
                  <InputRenderLeftContainer>
                    <Icons.PlusMedium color="neutral.c80" />
                  </InputRenderLeftContainer>
                )}
                clearable
                placeholder="Add missing flag"
                value={hiddenFlagName}
                onChange={handleAddHiddenFlag}
              />
              <Flex height={15} />
              {filteredFlags.map(([flagName, value]) => (
                <>
                  <Button
                    flexDirection="row"
                    py={1}
                    onClick={() => {
                      flagName === focusedName ? setFocusedName() : setFocusedName(flagName);
                    }}
                  >
                    <Flex flex={1} mr={3} alignItems="center">
                      <Box
                        bg={value?.enabled ? "success.c100" : "error.c100"}
                        height={10}
                        width={10}
                        mr={2}
                        borderRadius={999}
                      />
                      <Text mr={1}>{flagName}</Text>
                      {value?.overridesRemote ? (
                        <Tag active mx={1} type="opacity" size="small">
                          overridden locally
                        </Tag>
                      ) : null}
                      {value?.enabledOverriddenForCurrentLanguage ? (
                        <Tag active mx={1} type="outlinedOpacity" size="small">
                          disabled for current language
                        </Tag>
                      ) : null}
                    </Flex>
                  </Button>
                  {focusedName === flagName ? (
                    <Flex flexDirection="column" pl={6} rowGap={3}>
                      <EditSection
                        value={inputValues[flagName] || JSON.stringify(featureFlags[flagName])}
                        disabled={!inputValues[flagName]}
                        error={error}
                        onChange={handleInputChange}
                        onOverride={handleOverrideFeature}
                        onRestore={handleRestoreFeature}
                      />
                      <Flex p={3} backgroundColor="neutral.c30">
                        <Text whiteSpace="pre">
                          {JSON.stringify(featureFlags[flagName], null, 2)}
                        </Text>
                      </Flex>
                    </Flex>
                  ) : null}
                </>
              ))}
            </>
          )}
        </Flex>
      }
    >
      <Button small primary onClick={() => setVisible(!visible)}>
        {visible ? "Hide" : "Show"}
      </Button>
    </Row>
  );
};

export default withV3StyleProvider(FeatureFlagsButton);
