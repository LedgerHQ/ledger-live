import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  isContentAbTestOverridden,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Text, Flex, Tag } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import { Row } from "./FeatureFlagDetails";
import ContentAbTestEdit from "./ContentAbTestEdit";

export const CONTENT_AB_TESTS_PROJECT = "content-ab-tests-lw";

type Props = {
  testName: string;
  testValue: ContentAbTestPayload | undefined;
  focused?: boolean;
  setFocusedName: (arg0: string | undefined) => void;
};

const ContentAbTestDetails: React.FC<Props> = ({
  testName,
  testValue,
  focused,
  setFocusedName,
}) => {
  const { t } = useTranslation();

  const handleClick = useCallback(
    () => (focused ? setFocusedName(undefined) : setFocusedName(testName)),
    [focused, testName, setFocusedName],
  );

  return (
    <>
      <Row onClick={handleClick}>
        <Flex flex={1} mr={3} alignItems="center">
          <Box
            bg={testValue?.enabled ? "success.c50" : "error.c50"}
            height={10}
            width={10}
            mr={2}
            borderRadius={999}
          />
          <Text mr={1}>{testName}</Text>
          <Tag mx={1} type="opacity" size="small" textProps={{ uppercase: false }}>
            {CONTENT_AB_TESTS_PROJECT}
          </Tag>
          {isContentAbTestOverridden(testName) ? (
            <Tag active mx={1} type="opacity" size="small">
              {t("settings.developer.overridden.overriddenLocally")}
            </Tag>
          ) : null}
        </Flex>
      </Row>
      {focused ? <ContentAbTestEdit testName={testName} testValue={testValue} /> : null}
    </>
  );
};

export default ContentAbTestDetails;
