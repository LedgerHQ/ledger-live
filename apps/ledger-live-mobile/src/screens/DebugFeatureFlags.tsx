import React, { useCallback, useState, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  defaultFeatures,
  useFeatureFlags,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId, Feature } from "@ledgerhq/types-live";

import {
  BaseInput,
  Text,
  Flex,
  Button,
  Box,
  Tag,
  SearchInput,
  Switch,
  Icons,
} from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { includes, lowerCase } from "lodash";
import {
  InputRenderLeftContainer,
  InputRenderRightContainer,
} from "@ledgerhq/native-ui/components/Form/Input/BaseInput";
import NavigationScrollView from "../components/NavigationScrollView";
import Alert from "../components/Alert";

const Divider = styled(Box).attrs({
  width: "100%",
  my: 4,
  height: 1,
  bg: "neutral.c50",
})``;

const TagEnabled = styled(Tag).attrs({
  bg: "success.c100",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

const TagDisabled = styled(Tag).attrs({
  bg: "error.c100",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

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
    newVal => {
      onChange(JSON.stringify({ ...JSON.parse(value), enabled: newVal }));
    },
    [value, onChange],
  );
  return (
    <Flex>
      {error ? (
        <Flex mb={5}>
          <Alert type="warning">{error.toString()}</Alert>
        </Flex>
      ) : null}
      <BaseInput
        value={value}
        onChange={onChange}
        renderRight={() => (
          <InputRenderRightContainer>
            <Switch
              checked={tryParse(value)?.enabled}
              onChange={handleSwitchChange}
            />
          </InputRenderRightContainer>
        )}
      />
      <Flex flexDirection="row" mt={3}>
        <Button type="main" outline onPress={onRestore}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button disabled={disabled} type="main" onPress={onOverride} ml="3">
          {t("common.apply")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default function DebugFeatureFlags() {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();
  const [error, setError] = useState<unknown | null>(null);
  const [focusedName, setFocusedName] = useState<string | null>(null);
  const [hiddenFlagName, setHiddenFlagName] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [inputValues, setInputValues] = useState<{
    [key in FeatureId | string]?: string | undefined;
  }>({});

  const featureFlags = useMemo(() => {
    const features: { [key in FeatureId | string]: Feature } = {};
    const featureKeys = Object.keys(defaultFeatures);
    if (hiddenFlagName && !featureKeys.includes(hiddenFlagName))
      featureKeys.push(hiddenFlagName);
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
      setError(null);
      if (!focusedName) return;
      setInputValues(currentValues => ({
        ...currentValues,
        [focusedName]: value,
      }));
    },
    [focusedName],
  );

  const handleRestoreFeature = useCallback(() => {
    setError(null);
    if (!focusedName) return;
    setInputValues(currentValues => ({
      ...currentValues,
      [focusedName]: undefined,
    }));
    featureFlagsProvider.resetFeature(focusedName);
  }, [featureFlagsProvider, focusedName]);

  const handleOverrideFeature = useCallback(() => {
    setError(null);
    if (!focusedName) return;
    try {
      // Nb if value is invalid or missing, JSON parse will fail
      const newValue = JSON.parse(inputValues[focusedName]);
      featureFlagsProvider.overrideFeature(focusedName as FeatureId, newValue);
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

  const handleSearch = useCallback(value => {
    setSearchInput(value);
  }, []);

  const filteredFlags = useMemo(() => {
    return Object.entries(featureFlags)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(
        ([name]) =>
          !searchInput || includes(lowerCase(name), lowerCase(searchInput)),
      );
  }, [featureFlags, searchInput]);

  return (
    <NavigationScrollView>
      <View style={styles.root}>
        <Text mb={6}>{t("settings.debug.featureFlagsTitle")}</Text>
        <Flex flexDirection="row">
          <Text>Legend: </Text>
          <TagEnabled mx={2}>enabled flag</TagEnabled>
          <TagDisabled mx={2}>disabled flag</TagDisabled>
        </Flex>
        <Divider />
        <SearchInput
          value={searchInput}
          placeholder="Search flag"
          onChange={handleSearch}
          autoCapitalize="none"
        />
        <Flex mb={3} />
        <BaseInput
          value={undefined}
          renderLeft={() => (
            <InputRenderLeftContainer>
              <Icons.PlusMedium color="neutral.c70" />
            </InputRenderLeftContainer>
          )}
          placeholder="Add missing flag"
          onChange={handleAddHiddenFlag}
          autoCapitalize="none"
        />
        <Divider />
        {filteredFlags.length === 0 ? (
          <Text>{`No flag matching "${searchInput}"`}</Text>
        ) : null}
        {filteredFlags.map(([flagName, value], index, arr) => {
          const isFocused = focusedName === flagName;
          const isLast = index === arr.length - 1;
          return (
            <View key={flagName}>
              <Pressable
                onPress={() => setFocusedName(isFocused ? null : flagName)}
              >
                <Flex
                  flexDirection="row"
                  alignItems="center"
                  my={3}
                  flexWrap="wrap"
                >
                  {value?.enabled ? (
                    <TagEnabled>{flagName}</TagEnabled>
                  ) : (
                    <TagDisabled>{flagName}</TagDisabled>
                  )}
                  {value?.overridesRemote && (
                    <Tag my={1} mr={2}>
                      overridden locally
                    </Tag>
                  )}
                  {value?.enabledOverriddenForCurrentLanguage && (
                    <Tag my={1} mr={2}>
                      disabled for current language
                    </Tag>
                  )}
                </Flex>
              </Pressable>
              {isFocused ? (
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
              {isFocused && (
                <Flex mt={3} backgroundColor="neutral.c30">
                  <ScrollView horizontal>
                    <Text selectable>
                      {JSON.stringify(featureFlags[flagName], null, 2)}
                    </Text>
                  </ScrollView>
                </Flex>
              )}
              {!isLast && isFocused ? <Divider /> : null}
            </View>
          );
        })}
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});
