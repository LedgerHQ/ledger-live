import React, { useCallback, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
  setContentAbTestOverride,
  type ContentAbTests,
} from "@features/platform-content-ab-tests";
import { Divider, Flex, Link, Switch, Tag } from "@ledgerhq/native-ui";
import { TagEnabled } from "./FeatureFlagDetails";
import ContentAbTestDetails, { CONTENT_AB_TESTS_GROUP } from "./ContentAbTestDetails";
import { refreshMountedScreens } from "./refreshMountedScreens";

type Props = {
  contentAbTests: ContentAbTests;
  testNames: string[];
  focused: boolean;
  setFocusedGroupName: (name: string | undefined) => void;
  isLast: boolean;
};

function groupStatusColor(allEnabled: boolean, someEnabled: boolean) {
  if (allEnabled) return "success.c50";
  if (someEnabled) return "warning.c50";
  return "error.c50";
}

const ContentAbTestsGroup: React.FC<Props> = ({
  contentAbTests,
  testNames,
  focused,
  setFocusedGroupName,
  isLast,
}) => {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();

  const testsList = useMemo(
    () =>
      testNames.map((testName, index, arr) => (
        <ContentAbTestDetails
          key={testName}
          testName={testName}
          testValue={contentAbTests[testName]}
          focused={focusedName === testName}
          setFocusedName={setFocusedName}
          isLast={index === arr.length - 1}
        />
      )),
    [testNames, contentAbTests, focusedName],
  );

  const someEnabled = testNames.some(testName => contentAbTests[testName]?.enabled);
  const allEnabled =
    testNames.length > 0 && testNames.every(testName => contentAbTests[testName]?.enabled);
  const someOverridden = hasContentAbTestOverrides();

  const handlePress = useCallback(
    () => setFocusedGroupName(focused ? undefined : CONTENT_AB_TESTS_GROUP),
    [focused, setFocusedGroupName],
  );

  const handleSwitchChange = useCallback(
    (enabled: boolean) => {
      testNames.forEach(testName => {
        const payload = contentAbTests[testName];
        if (payload) setContentAbTestOverride(testName, { ...payload, enabled });
      });
      refreshMountedScreens();
    },
    [testNames, contentAbTests],
  );

  const handleRestore = useCallback(() => {
    clearContentAbTestOverrides();
    refreshMountedScreens();
  }, []);

  return (
    <Flex mb={2}>
      <Pressable onPress={handlePress}>
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Flex flexDirection="row" alignItems="center">
            <TagEnabled backgroundColor={groupStatusColor(allEnabled, someEnabled)}>
              {CONTENT_AB_TESTS_GROUP}
            </TagEnabled>
            {someOverridden ? (
              <Tag my={1} mr={2}>
                overridden locally
              </Tag>
            ) : null}
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            {someOverridden ? (
              <Link size="small" type="color" onPress={handleRestore}>
                {t("settings.debug.featureFlagsRestore")}
              </Link>
            ) : null}
            <Flex mr={3} />
            <Switch checked={allEnabled} onChange={handleSwitchChange} />
          </Flex>
        </Flex>
      </Pressable>
      {focused ? <Flex pl={6}>{testsList}</Flex> : null}
      {!isLast && focused ? <Divider /> : null}
    </Flex>
  );
};

export default ContentAbTestsGroup;
