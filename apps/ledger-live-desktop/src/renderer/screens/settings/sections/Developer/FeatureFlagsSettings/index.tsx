import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ButtonV2 from "~/renderer/components/Button";
import Button from "~/renderer/components/ButtonV3";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  defaultFeatures,
  groupedFeatures,
  useFeature,
  useFeatureFlags,
  useHasLocallyOverriddenFeatureFlags,
} from "@ledgerhq/live-common/featureFlags/index";
import { Flex, SearchInput, Alert, Tag, Text, Switch } from "@ledgerhq/react-ui";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { FeatureId } from "@ledgerhq/types-live";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import trim from "lodash/trim";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import FeatureFlagDetails from "./FeatureFlagDetails";
import GroupedFeatures from "./GroupedFeatures";
import TabBar from "~/renderer/components/TabBar";
import { featureFlagsButtonVisibleSelector } from "~/renderer/reducers/settings";
import { setFeatureFlagsButtonVisible } from "~/renderer/actions/settings";

const addFlagHint = `\
If a feature flag is defined in the targeted Firebase environment \
but it is missing from the following list, you can type its **exact** name in \
the search input and it will appear in the list. Type the \
flag name in camelCase without the "feature" prefix.\
`;

export const FeatureFlagContent = withV3StyleProvider((props: { expanded?: boolean }) => {
  const { t } = useTranslation();
  const featureFlagsButtonVisible = useSelector(featureFlagsButtonVisibleSelector);
  const dispatch = useDispatch();
  const { getFeature, overrideFeature, isFeature, resetFeatures } = useFeatureFlags();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const searchInputTrimmed = trim(searchInput);
  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const [focusedGroupName, setFocusedGroupName] = useState<string | undefined>();

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(defaultFeatures);
    if (searchInputTrimmed && !featureKeys.includes(searchInputTrimmed)) {
      const isHiddenFeature = isFeature(searchInputTrimmed);

      // Only adds the search input value to the featureKeys if it is an existing hidden feature
      if (isHiddenFeature) {
        featureKeys.push(searchInputTrimmed);
      }
    }
    return featureKeys;
  }, [isFeature, searchInputTrimmed]);

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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressCount = useRef(0);

  const [cheatActivated, setCheatActivated] = useState(false);
  const ruleThemAll = useCallback(() => {
    groupedFeatures.stax.featureIds.forEach(featureId =>
      overrideFeature(featureId, { ...getFeature(featureId), enabled: true }),
    );
    setCheatActivated(true);
  }, [overrideFeature, getFeature]);

  const onDescriptionClick = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pressCount.current += 1;
    const timeout = setTimeout(() => {
      pressCount.current = 0;
    }, 300);
    if (pressCount.current > 6) {
      ruleThemAll();
      pressCount.current = 0;
    }
    timeoutRef.current = timeout;
    return () => {
      clearTimeout(timeout);
    };
  }, [ruleThemAll]);

  const flagsList = useMemo(
    () =>
      filteredFlags.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
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
    params !== null && typeof params === "object" && "project" in params
      ? (params as { project: string }).project
      : "";

  const handleChangeTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const setFeatureFlagButtonVisible = useCallback(() => {
    dispatch(setFeatureFlagsButtonVisible(!featureFlagsButtonVisible));
  }, [dispatch, featureFlagsButtonVisible]);

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div onClick={onDescriptionClick}>
        {t("settings.developer.featureFlagsDesc")}
        {cheatActivated ? " With great power comes great responsibility." : null}
      </div>
      {!props.expanded ? null : (
        <>
          <Flex flexDirection="row" alignItems="center" columnGap={3}>
            {t("settings.developer.firebaseProject")}
            <Tag type="opacity" size="small" textProps={{ uppercase: false }} active>
              {project}
            </Tag>
          </Flex>
          <SearchInput
            placeholder="Search"
            value={searchInput}
            onChange={setSearchInput}
            clearable
          />
          <Alert type="info" title={addFlagHint} showIcon={false} />
          <Flex flexDirection="row" justifyContent="space-between" mt={5}>
            <Text>{t("settings.developer.showButtonDesc")}</Text>
            <Switch
              name="button-feature-flags-visibible"
              checked={featureFlagsButtonVisible}
              onChange={setFeatureFlagButtonVisible}
            />
          </Flex>
          <Button
            alignSelf={"flex-start"}
            mt={3}
            variant="color"
            onClick={resetFeatures}
            disabled={!hasLocallyOverriddenFlags}
          >
            {t("settings.developer.featureFlagsRestoreAll")}
          </Button>
          <Flex height={15} />
          <TabBar
            onIndexChange={handleChangeTab}
            defaultIndex={activeTabIndex}
            index={activeTabIndex}
            tabs={["All", "Groups"]}
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
  const location = useLocation<{ shouldOpenFeatureFlags?: boolean }>();

  useEffect(() => setContentExpanded(Boolean(location.state?.shouldOpenFeatureFlags)), [
    location.state?.shouldOpenFeatureFlags,
  ]);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <Row
      title={t("settings.developer.featureFlagsTitle")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: contentExpanded ? "flex-start" : "center" }}
      desc={<FeatureFlagContent expanded={contentExpanded} />}
    >
      <ButtonV2 small primary onClick={toggleContentVisibility}>
        {contentExpanded ? "Hide" : "Show"}
      </ButtonV2>
    </Row>
  );
};

export default FeatureFlagsSettings;
