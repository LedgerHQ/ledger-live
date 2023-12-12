import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_FEATURES,
  groupedFeatures,
  useFeature,
  useFeatureFlags,
  useHasLocallyOverriddenFeatureFlags,
} from "@ledgerhq/live-config/featureFlags/index";
import type { FeatureId } from "@ledgerhq/types-live";

import {
  Text,
  Flex,
  SearchInput,
  Divider,
  Tag,
  ChipTabs,
  Button,
  Switch,
} from "@ledgerhq/native-ui";
import { includes, lowerCase, trim } from "lodash";
import { SafeAreaView } from "react-native-safe-area-context";
import { Keyboard } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NavigationScrollView from "~/components/NavigationScrollView";
import FeatureFlagDetails, { TagDisabled, TagEnabled } from "./FeatureFlagDetails";
import Alert from "~/components/Alert";
import GroupedFeatures from "./GroupedFeatures";
import { featureFlagsBannerVisibleSelector } from "~/reducers/settings";
import { setFeatureFlagsBannerVisible } from "~/actions/settings";

const addFlagHint = `\
If a feature flag is defined in the Firebase project \
but it is missing here, you can type its name (camelCase, without "feature" prefix) in \
the search field.`;

export default function DebugFeatureFlags() {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [focusedGroupName, setFocusedGroupName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState<string>("");
  const searchInputTrimmed = trim(searchInput);
  const [activeTab, setActiveTab] = useState(0);
  const { resetFeatures, isFeature } = useFeatureFlags();

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(DEFAULT_FEATURES);

    if (searchInputTrimmed && !featureKeys.includes(searchInputTrimmed)) {
      const isHiddenFeature = isFeature(searchInputTrimmed);

      // Only adds the search input value to the featureKeys if it is an existing hidden feature
      if (isHiddenFeature) {
        featureKeys.push(searchInputTrimmed);
      }
    }

    return featureKeys;
  }, [isFeature, searchInputTrimmed]);

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const filteredFlags = useMemo(() => {
    return featureFlags
      .sort()
      .filter(name => !searchInput || includes(lowerCase(name), lowerCase(searchInput)));
  }, [featureFlags, searchInput]);

  const filteredGroups = useMemo(() => {
    return Object.keys(groupedFeatures)
      .sort()
      .filter(
        groupName =>
          !searchInput ||
          includes(lowerCase(groupName), lowerCase(searchInput)) ||
          groupedFeatures[groupName].featureIds.some(featureId =>
            includes(lowerCase(featureId), lowerCase(searchInput)),
          ),
      );
  }, [searchInput]);

  const flagsList = useMemo(
    () =>
      filteredFlags.map((flagName, index, arr) => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
          isLast={index === arr.length - 1}
        />
      )),
    [filteredFlags, focusedName],
  );

  const groupsList = useMemo(
    () =>
      filteredGroups
        .sort()
        .map((groupName, index, arr) => (
          <GroupedFeatures
            key={groupName}
            groupName={groupName}
            focused={focusedGroupName === groupName}
            setFocusedGroupName={setFocusedGroupName}
            isLast={index === arr.length - 1}
          />
        )),
    [filteredGroups, focusedGroupName],
  );

  const config = useFeature("firebaseEnvironmentReadOnly");
  const params = config?.params;
  const project =
    params !== null && typeof params === "object" && "project" in params
      ? (params as { project: string }).project
      : "";

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const listenerShow = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const listenerHide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      listenerShow.remove();
      listenerHide.remove();
    };
  }, []);

  const additionalInfo = <Alert title={addFlagHint} type="hint" noIcon />;

  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const featureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const dispatch = useDispatch();
  const setFeatureFlagBannerVisible = useCallback(
    (newVal: boolean) => {
      dispatch(setFeatureFlagsBannerVisible(newVal));
    },
    [dispatch],
  );

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <NavigationScrollView>
        <Flex px={16}>
          <Alert type="primary" noIcon>
            {t("settings.debug.featureFlagsTitle")}
          </Alert>
          <Flex flexDirection="row" mt={4}>
            <Text>Legend: </Text>
            <TagEnabled mx={2}>enabled flag</TagEnabled>
            <TagDisabled mx={2}>disabled flag</TagDisabled>
          </Flex>
          <Text my={3}>{t("settings.debug.firebaseProject")}</Text>
          <Tag uppercase={false} type="color" alignSelf={"flex-start"}>
            {project}
          </Tag>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text mt={3}>{t("settings.debug.showBannerDesc")}</Text>
            <Switch checked={featureFlagsBannerVisible} onChange={setFeatureFlagBannerVisible} />
          </Flex>
          <Divider />
          <ChipTabs
            labels={[
              t("settings.debug.featureFlagsTabAll"),
              t("settings.debug.featureFlagsTabGroups"),
            ]}
            activeIndex={activeTab}
            onChange={setActiveTab}
          />
          <Flex mt={3} />
          <SearchInput
            value={searchInput}
            placeholder="Search flag"
            onChange={handleSearch}
            autoCapitalize="none"
          />
          <Button
            mt={3}
            size="small"
            type="main"
            outline
            onPress={resetFeatures}
            disabled={!hasLocallyOverriddenFlags}
          >
            {t("settings.debug.featureFlagsRestoreAll")}
          </Button>
          <Divider />
          {activeTab === 0 ? (
            <>
              {filteredFlags.length === 0 ? (
                <>
                  <Text>{`No flag matching "${searchInput}"`}</Text>
                  {keyboardVisible ? additionalInfo : null}
                </>
              ) : null}
              {flagsList}
            </>
          ) : (
            <>{groupsList}</>
          )}
        </Flex>
      </NavigationScrollView>
      {keyboardVisible ? null : (
        <Flex px={16} mt={3}>
          {additionalInfo}
        </Flex>
      )}
    </SafeAreaView>
  );
}
