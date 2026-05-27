import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import {
  FEATURE_FLAGS_DEFAULTS,
  FeatureId,
  FeatureIdSchema,
  featureFlagsBannerVisibleSelector,
  groupedFeatures,
  setAllOverrides,
  setBannerVisible,
} from "@shared/feature-flags";
import { useFeature, useHasLocallyOverriddenFeatureFlags } from "@features/platform-feature-flags";
import { Flex, SearchInput, Alert, Tag, Text } from "@ledgerhq/react-ui";
import { Switch, Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import trim from "lodash/trim";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import FeatureFlagDetails from "./FeatureFlagDetails";
import GroupedFeatures from "./GroupedFeatures";
import TabBar from "~/renderer/components/TabBar";
import { objectKeysType } from "@ledgerhq/live-common/helpers";

export const FeatureFlagContent = withV3StyleProvider((props: { expanded?: boolean }) => {
  const { t } = useTranslation();
  const featureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const dispatch = useDispatch();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const searchInputTrimmed = trim(searchInput);
  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const [focusedGroupName, setFocusedGroupName] = useState<string | undefined>();

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(FEATURE_FLAGS_DEFAULTS);
    if (
      searchInputTrimmed &&
      !featureKeys.includes(searchInputTrimmed) &&
      FeatureIdSchema.safeParse(searchInputTrimmed).success
    ) {
      // Only adds the search input value to the featureKeys if it is an existing hidden feature
      featureKeys.push(searchInputTrimmed);
    }
    return featureKeys;
  }, [searchInputTrimmed]);

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
      filteredFlags.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
        />
      )),
    [filteredFlags, focusedName],
  );

  const groupsList = useMemo(
    () =>
      filteredGroups
        .sort()
        .map(groupName => (
          <GroupedFeatures
            key={groupName}
            groupName={groupName}
            focused={focusedGroupName === groupName}
            setFocusedGroupName={setFocusedGroupName}
          />
        )),
    [filteredGroups, focusedGroupName],
  );

  const config = useFeature("firebaseEnvironmentReadOnly");
  const params = config?.params;
  const project =
    params !== null && typeof params === "object" && "project" in params ? params.project : "";

  const handleChangeTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const setFeatureFlagBannerVisible = useCallback(() => {
    dispatch(setBannerVisible(!featureFlagsBannerVisible));
  }, [dispatch, featureFlagsBannerVisible]);

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.featureFlagsDesc")}</div>
      {!props.expanded ? null : (
        <>
          <Flex flexDirection="row" alignItems="center" columnGap={3}>
            {t("settings.developer.firebaseProject")}
            <Tag type="opacity" size="small" textProps={{ uppercase: false }} active>
              {project}
            </Tag>
          </Flex>
          <SearchInput
            placeholder={t("settings.developer.search")}
            value={searchInput}
            onChange={setSearchInput}
            clearable
          />
          <Alert type="info" title={t("settings.developer.flagHint")} showIcon={false} />
          <Flex flexDirection="row" justifyContent="space-between" mt={5}>
            <Text>{t("settings.developer.showButtonDesc")}</Text>
            <Switch
              name="button-feature-flags-visibible"
              selected={featureFlagsBannerVisible}
              onChange={setFeatureFlagBannerVisible}
            />
          </Flex>
          <Button
            style={{ alignSelf: "flex-start", marginTop: 12 }}
            appearance="accent"
            onClick={() => dispatch(setAllOverrides({}))}
            disabled={!hasLocallyOverriddenFlags}
          >
            {t("settings.developer.featureFlagsRestoreAll")}
          </Button>
          <Flex height={15} />
          <TabBar
            onIndexChange={handleChangeTab}
            defaultIndex={activeTabIndex}
            index={activeTabIndex}
            tabs={[t("settings.developer.all"), t("settings.developer.groups")]}
            separator
            withId
            fontSize={14}
            height={46}
          />
          {activeTabIndex === 0 ? flagsList : groupsList}
        </>
      )}
    </Flex>
  );
});

const FeatureFlagsSettings = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);
  const location = useLocation();
  const locationState = location.state as { shouldOpenFeatureFlags?: boolean } | null;

  useEffect(
    () => setContentExpanded(Boolean(locationState?.shouldOpenFeatureFlags)),
    [locationState?.shouldOpenFeatureFlags],
  );

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <Row
      title={t("settings.developer.featureFlagsTitle")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start", flexShrink: 0 }}
      desc={<FeatureFlagContent expanded={contentExpanded} />}
    >
      <Button size="sm" appearance="accent" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default FeatureFlagsSettings;
