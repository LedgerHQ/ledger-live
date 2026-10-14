import React, { useCallback, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
  setContentAbTestOverride,
  type ContentAbTests,
} from "@features/platform-content-ab-tests";
import { Box, Divider, Link, Switch, Tag } from "@ledgerhq/lumen-ui-rnative";
import ContentAbTestDetails, { CONTENT_AB_TESTS_GROUP } from "./ContentAbTestDetails";
import { refreshMountedScreens } from "./refreshMountedScreens";

type Props = {
  contentAbTests: ContentAbTests;
  testNames: string[];
  focused: boolean;
  setFocusedGroupName: (name: string | undefined) => void;
  isLast: boolean;
};

function groupStatusAppearance(allEnabled: boolean, someEnabled: boolean) {
  if (allEnabled) return "success" as const;
  if (someEnabled) return "warning" as const;
  return "error" as const;
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
    <Box lx={{ marginBottom: "s8" }}>
      <Pressable onPress={handlePress}>
        <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
            <Tag
              label={CONTENT_AB_TESTS_GROUP}
              size="sm"
              appearance={groupStatusAppearance(allEnabled, someEnabled)}
            />
            {someOverridden ? <Tag label="overridden locally" size="sm" appearance="gray" /> : null}
          </Box>
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}>
            {someOverridden ? (
              <Link appearance="accent" size="sm" onPress={handleRestore}>
                {t("settings.debug.featureFlagsRestore")}
              </Link>
            ) : null}
            <Switch checked={allEnabled} onCheckedChange={handleSwitchChange} />
          </Box>
        </Box>
      </Pressable>
      {focused ? <Box lx={{ paddingLeft: "s24" }}>{testsList}</Box> : null}
      {!isLast && focused ? <Divider /> : null}
    </Box>
  );
};

export default ContentAbTestsGroup;
