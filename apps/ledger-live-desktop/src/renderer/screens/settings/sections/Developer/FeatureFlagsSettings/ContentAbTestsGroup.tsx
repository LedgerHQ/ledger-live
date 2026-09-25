import React, { useCallback, useMemo, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
  setContentAbTestOverride,
  type ContentAbTests,
} from "~/firebase/contentAbTestCopy";
import { Flex, Link, Tag, Box, Text } from "@ledgerhq/react-ui";
import { Switch } from "@ledgerhq/lumen-ui-react";
import { Row } from "./FeatureFlagDetails";
import ContentAbTestDetails, { CONTENT_AB_TESTS_GROUP } from "./ContentAbTestDetails";

type Props = {
  contentAbTests: ContentAbTests;
  testNames: string[];
  focused: boolean;
  setFocusedGroupName: (name: string | undefined) => void;
};

const ContentAbTestsGroup = ({
  contentAbTests,
  testNames,
  focused,
  setFocusedGroupName,
}: Props) => {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();

  const testsList = useMemo(
    () =>
      testNames.map(testName => (
        <ContentAbTestDetails
          key={testName}
          testName={testName}
          testValue={contentAbTests[testName]}
          focused={focusedName === testName}
          setFocusedName={setFocusedName}
        />
      )),
    [testNames, contentAbTests, focusedName],
  );

  const someEnabled = testNames.some(testName => contentAbTests[testName]?.enabled);
  const allEnabled =
    testNames.length > 0 && testNames.every(testName => contentAbTests[testName]?.enabled);
  const someOverridden = hasContentAbTestOverrides();

  const handleSwitchChange = useCallback(() => {
    testNames.forEach(testName => {
      const payload = contentAbTests[testName];
      if (payload) setContentAbTestOverride(testName, { ...payload, enabled: !allEnabled });
    });
  }, [allEnabled, testNames, contentAbTests]);

  const handleRestore = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    clearContentAbTestOverrides();
  }, []);

  return (
    <>
      <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
        <Row
          flex={1}
          onClick={() => setFocusedGroupName(focused ? undefined : CONTENT_AB_TESTS_GROUP)}
        >
          <Flex flex={1} mr={3} alignItems="center">
            <Box
              bg={allEnabled ? "success.c50" : someEnabled ? "warning.c50" : "error.c50"}
              height={10}
              width={10}
              mr={2}
              borderRadius={999}
            />
            <Text mr={1}>{CONTENT_AB_TESTS_GROUP}</Text>
            {someOverridden ? (
              <>
                <Tag active mx={1} type="opacity" size="small">
                  {t("settings.developer.overridden.overriddenLocally")}
                </Tag>
                <Link size="small" type="color" onClick={handleRestore}>
                  {t("settings.developer.featureFlagsRestore")}
                </Link>
              </>
            ) : null}
          </Flex>
        </Row>
        <Switch name="group-content-ab-tests" selected={allEnabled} onChange={handleSwitchChange} />
      </Flex>
      {focused ? (
        <Flex pl={6} flexDirection="column">
          {testsList}
        </Flex>
      ) : null}
    </>
  );
};

export default ContentAbTestsGroup;
