import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  defaultFeatures,
  useFeature,
} from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId } from "@ledgerhq/types-live";

import {
  BaseInput,
  Text,
  Flex,
  SearchInput,
  Icons,
  Tag,
} from "@ledgerhq/native-ui";
import { includes, lowerCase, trim } from "lodash";
import { SafeAreaView } from "react-native-safe-area-context";
import { Keyboard } from "react-native";
import NavigationScrollView from "../../components/NavigationScrollView";
import FeatureFlagDetails, {
  Divider,
  TagDisabled,
  TagEnabled,
} from "./FeatureFlagDetails";
import Alert from "../../components/Alert";

const addFlagHint = `\
If a feature flag is defined in the targeted Firebase environment \
but it is missing from the list, you can type its **exact** name in \
the search input field above and it will appear in the list.\nType the \
flag name in camelCase without the "feature" prefix.\
`;

export default function DebugFeatureFlags() {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState<string>("");
  const searchInputTrimmed = trim(searchInput);

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(defaultFeatures);
    if (searchInputTrimmed && !featureKeys.includes(searchInputTrimmed))
      featureKeys.push(searchInputTrimmed);
    return featureKeys;
  }, [searchInputTrimmed]);

  const handleSearch = useCallback(value => {
    setSearchInput(value);
  }, []);

  const filteredFlags = useMemo(() => {
    return featureFlags
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(
        name =>
          !searchInput || includes(lowerCase(name), lowerCase(searchInput)),
      );
  }, [featureFlags, searchInput]);

  const content = useMemo(
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

  const config = useFeature("firebaseEnvironmentReadOnly");
  const params = config?.params;
  const project =
    params !== null && typeof params === "object" && "project" in params
      ? (params as { project: string }).project
      : "";

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const listenerShow = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const listenerHide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      listenerShow.remove();
      listenerHide.remove();
    };
  }, []);

  const additionalInfo = <Alert title={addFlagHint} type="hint" />;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <NavigationScrollView>
        <Flex p={16}>
          <Text mb={3}>{t("settings.debug.firebaseProject")}</Text>
          <Tag mb={6} uppercase={false} type="color" alignSelf={"flex-start"}>
            {project}
          </Tag>
          <Alert type="hint">
            <Text>{t("settings.debug.featureFlagsTitle")}</Text>
          </Alert>
          <Flex mt={3} />
          <SearchInput
            value={searchInput}
            placeholder="Search flag"
            onChange={handleSearch}
            autoCapitalize="none"
          />
          <Flex flexDirection="row" mt={4}>
            <Text>Legend: </Text>
            <TagEnabled mx={2}>enabled flag</TagEnabled>
            <TagDisabled mx={2}>disabled flag</TagDisabled>
          </Flex>
          <Divider />
          {filteredFlags.length === 0 ? (
            <>
              <Text>{`No flag matching "${searchInput}"`}</Text>
              {keyboardVisible ? additionalInfo : null}
            </>
          ) : null}
          {content}
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
