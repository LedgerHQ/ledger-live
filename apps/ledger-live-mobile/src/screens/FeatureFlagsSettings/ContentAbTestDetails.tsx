import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import {
  isContentAbTestOverridden,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Flex, Divider, Tag } from "@ledgerhq/native-ui";
import { TagDisabled, TagEnabled } from "./FeatureFlagDetails";
import ContentAbTestEdit from "./ContentAbTestEdit";

export const CONTENT_AB_TESTS_GROUP = "contentAbTests";

type Props = {
  testName: string;
  testValue: ContentAbTestPayload | undefined;
  focused?: boolean;
  setFocusedName: (name: string | undefined) => void;
  isLast?: boolean;
};

const ContentAbTestDetails: React.FC<Props> = ({
  testName,
  testValue,
  focused,
  setFocusedName,
  isLast,
}) => {
  const handlePress = useCallback(
    () => setFocusedName(focused ? undefined : testName),
    [focused, testName, setFocusedName],
  );

  return (
    <View>
      <Pressable onPress={handlePress}>
        <Flex flexDirection="row" alignItems="center" my={3} flexWrap="wrap">
          {testValue?.enabled ? (
            <TagEnabled>{testName}</TagEnabled>
          ) : (
            <TagDisabled>{testName}</TagDisabled>
          )}
          <Tag my={1} mr={2}>
            feature_copy
          </Tag>
          {isContentAbTestOverridden(testName) ? (
            <Tag my={1} mr={2}>
              overridden locally
            </Tag>
          ) : null}
        </Flex>
      </Pressable>
      {focused ? <ContentAbTestEdit testName={testName} testValue={testValue} /> : null}
      {!isLast && focused ? <Divider /> : null}
    </View>
  );
};

export default ContentAbTestDetails;
