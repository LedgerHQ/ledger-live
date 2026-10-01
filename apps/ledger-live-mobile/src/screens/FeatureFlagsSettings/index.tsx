import React, { useCallback, useState, useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { getApp } from "@react-native-firebase/app";
import { useHasLocallyOverriddenFeatureFlags } from "@features/platform-feature-flags";
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
  Box,
  Button,
  Divider,
  SearchInput,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import trim from "lodash/trim";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import NavigationScrollView from "~/components/NavigationScrollView";
import KeyboardView from "~/components/KeyboardView";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
} from "@features/platform-content-ab-tests";
import FeatureFlagDetails, { TagDisabled, TagEnabled } from "./FeatureFlagDetails";
import Alert from "~/components/Alert";
import GroupedFeatures from "./GroupedFeatures";
import ContentAbTestDetails, { CONTENT_AB_TESTS_GROUP } from "./ContentAbTestDetails";
import ContentAbTestsGroup from "./ContentAbTestsGroup";
import { refreshMountedScreens } from "./refreshMountedScreens";
import { useContentAbTests } from "./useContentAbTests";
import { objectKeysType } from "@ledgerhq/live-common/helpers";

const addFlagHint = `\
If a feature flag is defined in the Firebase project \
but it is missing here, you can type its name (camelCase, without "feature" prefix) in \
the search field.`;

export default function DebugFeatureFlags() {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [focusedContentAbTest, setFocusedContentAbTest] = useState<string | undefined>();
  const [focusedGroupName, setFocusedGroupName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState<string>("");
  const contentAbTests = useContentAbTests();
  const searchInputTrimmed = trim(searchInput);
  const [activeTab, setActiveTab] = useState<"all" | "groups">("all");
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

  const contentAbTestNames = useMemo(
    () => Object.keys(contentAbTests).sort((a, b) => a.localeCompare(b)),
    [contentAbTests],
  );

  const filteredContentAbTests = useMemo(
    () =>
      contentAbTestNames.filter(
        name => !searchInput || includes(lowerCase(name), lowerCase(searchInput)),
      ),
    [contentAbTestNames, searchInput],
  );

  const flagsList = useMemo(() => {
    const rows = [
      ...filteredContentAbTests.map(name => ({ kind: "ab" as const, name })),
      ...filteredFlags.map(name => ({ kind: "ff" as const, name })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return rows.map((row, index) =>
      row.kind === "ab" ? (
        <ContentAbTestDetails
          key={`ab-${row.name}`}
          testName={row.name}
          testValue={contentAbTests[row.name]}
          focused={focusedContentAbTest === row.name}
          setFocusedName={setFocusedContentAbTest}
          isLast={index === rows.length - 1}
        />
      ) : (
        <FeatureFlagDetails
          key={`ff-${row.name}`}
          focused={focusedName === row.name}
          flagName={row.name as FeatureId}
          setFocusedName={setFocusedName}
          isLast={index === rows.length - 1}
        />
      ),
    );
  }, [filteredContentAbTests, filteredFlags, contentAbTests, focusedContentAbTest, focusedName]);

  const contentAbTestsGroupVisible =
    contentAbTestNames.length > 0 &&
    (!searchInput ||
      filteredContentAbTests.length > 0 ||
      includes(lowerCase(CONTENT_AB_TESTS_GROUP), lowerCase(searchInput)));

  const groupsList = useMemo(() => {
    const items: Array<
      { kind: "ab" } | { kind: "ff"; groupName: (typeof filteredGroups)[number] }
    > = filteredGroups.map(groupName => ({ kind: "ff" as const, groupName }));
    if (contentAbTestsGroupVisible) items.push({ kind: "ab" });

    items.sort((a, b) => {
      const nameA = a.kind === "ab" ? CONTENT_AB_TESTS_GROUP : a.groupName;
      const nameB = b.kind === "ab" ? CONTENT_AB_TESTS_GROUP : b.groupName;
      return nameA.localeCompare(nameB);
    });

    return items.map((item, index) =>
      item.kind === "ab" ? (
        <ContentAbTestsGroup
          key={CONTENT_AB_TESTS_GROUP}
          contentAbTests={contentAbTests}
          testNames={contentAbTestNames}
          focused={focusedGroupName === CONTENT_AB_TESTS_GROUP}
          setFocusedGroupName={setFocusedGroupName}
          isLast={index === items.length - 1}
        />
      ) : (
        <GroupedFeatures
          key={item.groupName}
          groupName={item.groupName}
          focused={focusedGroupName === item.groupName}
          setFocusedGroupName={setFocusedGroupName}
          isLast={index === items.length - 1}
        />
      ),
    );
  }, [
    filteredGroups,
    contentAbTestsGroupVisible,
    contentAbTests,
    contentAbTestNames,
    focusedGroupName,
  ]);

  // From the bundled Firebase config: the remote flag value is set by hand and can be wrong.
  const project = getApp().options.projectId;

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
          <Box lx={{ paddingHorizontal: "s16" }}>
            <Alert type="primary" noIcon>
              {t("settings.debug.featureFlagsTitle")}
            </Alert>
            <Box lx={{ flexDirection: "row", alignItems: "center", marginTop: "s4" }}>
              <Text typography="body2">Legend: </Text>
              <TagEnabled mx={2}>enabled flag</TagEnabled>
              <TagDisabled mx={2}>disabled flag</TagDisabled>
            </Box>
            <Text typography="body2" lx={{ marginVertical: "s12" }}>
              {t("settings.debug.firebaseProject")}
            </Text>
            <Tag label={project} appearance="accent" lx={{ alignSelf: "flex-start" }} />
            <Box
              lx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "s12",
                marginTop: "s12",
              }}
            >
              <Text typography="body2" lx={{ flexShrink: 1 }}>
                {t("settings.debug.showBannerDesc")}
              </Text>
              <Switch
                checked={featureFlagsBannerVisible}
                onCheckedChange={setFeatureFlagBannerVisible}
              />
            </Box>
            <Divider lx={{ marginVertical: "s12" }} />
            <SegmentedControl
              selectedValue={activeTab}
              onSelectedChange={setActiveTab}
              accessibilityLabel={t("settings.debug.featureFlagsTitle")}
            >
              <SegmentedControlButton value="all">
                {t("settings.debug.featureFlagsTabAll")}
              </SegmentedControlButton>
              <SegmentedControlButton value="groups">
                {t("settings.debug.featureFlagsTabGroups")}
              </SegmentedControlButton>
            </SegmentedControl>
            <SearchInput
              value={searchInput}
              placeholder="Search flag"
              onChangeText={handleSearch}
              autoCapitalize="none"
              lx={{ marginTop: "s12" }}
            />
            <Button
              appearance="gray"
              size="sm"
              lx={{ marginTop: "s12" }}
              onPress={() => {
                dispatch(setAllOverrides({}));
                clearContentAbTestOverrides();
                refreshMountedScreens();
              }}
              disabled={!hasLocallyOverriddenFlags && !hasContentAbTestOverrides()}
            >
              {t("settings.debug.featureFlagsRestoreAll")}
            </Button>
            <Divider lx={{ marginVertical: "s12" }} />
            {activeTab === "all" ? (
              <>
                {filteredFlags.length === 0 && filteredContentAbTests.length === 0 ? (
                  <>
                    <Text typography="body2">{`No flag matching "${searchInput}"`}</Text>
                    {additionalInfo}
                  </>
                ) : null}
                {flagsList}
              </>
            ) : (
              <>{groupsList}</>
            )}
          </Box>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
