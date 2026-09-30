import React, { useCallback, useState, useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useFeature, useHasLocallyOverriddenFeatureFlags } from "@features/platform-feature-flags";
import {
  FEATURE_FLAGS_DEFAULTS,
  FeatureIdSchema,
  featureFlagsBannerVisibleSelector,
  groupedFeatures,
  setAllOverrides,
  setBannerVisible,
} from "@shared/feature-flags";
import type { FeatureId } from "@shared/feature-flags";

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
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import trim from "lodash/trim";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import NavigationScrollView from "~/components/NavigationScrollView";
import KeyboardView from "~/components/KeyboardView";
import FeatureFlagDetails, { TagDisabled, TagEnabled } from "./FeatureFlagDetails";
import Alert from "~/components/Alert";
import GroupedFeatures from "./GroupedFeatures";
import { objectKeysType } from "@ledgerhq/live-common/helpers";

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
  const dispatch = useDispatch();

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(FEATURE_FLAGS_DEFAULTS);

    if (searchInputTrimmed && !featureKeys.includes(searchInputTrimmed)) {
      const isHiddenFeature = FeatureIdSchema.safeParse(searchInputTrimmed).success;

      // Only adds the search input value to the featureKeys if it is an existing hidden feature
      if (isHiddenFeature) {
        featureKeys.push(searchInputTrimmed);
      }
    }

    return featureKeys;
  }, [searchInputTrimmed]);

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const filteredFlags = useMemo(() => {
    return featureFlags
      .sort()
      .filter(name => !searchInput || includes(lowerCase(name), lowerCase(searchInput)));
  }, [featureFlags, searchInput]);

  const filteredGroups = useMemo(() => {
    return objectKeysType(groupedFeatures)
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
    params !== null && typeof params === "object" && "project" in params ? params.project : "";

  const additionalInfo = <Alert title={addFlagHint} type="hint" noIcon />;
  const keyboardBehavior = Platform.OS === "ios" ? "padding" : "height";

  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const featureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const setFeatureFlagBannerVisible = useCallback(
    (newVal: boolean) => {
      dispatch(setBannerVisible(newVal));
    },
    [dispatch],
  );

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <KeyboardView behavior={keyboardBehavior}>
        <NavigationScrollView keyboardShouldPersistTaps="handled">
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
              <Text flexShrink={1} mt={3}>
                {t("settings.debug.showBannerDesc")}
              </Text>
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
              onPress={() => dispatch(setAllOverrides({}))}
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
                    {additionalInfo}
                  </>
                ) : null}
                {flagsList}
              </>
            ) : (
              <>{groupsList}</>
            )}
          </Flex>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
