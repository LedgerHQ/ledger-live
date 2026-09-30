import React, { useCallback } from "react";
import { Pressable } from "react-native";
import {
  isContentAbTestOverridden,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Box, Divider, Tag } from "@ledgerhq/lumen-ui-rnative";
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
    <Box>
      <Pressable onPress={handlePress}>
        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "s8",
            marginVertical: "s12",
          }}
        >
          <Tag label={testName} size="sm" appearance={testValue?.enabled ? "success" : "error"} />
          <Tag label="feature_copy" size="sm" appearance="gray" />
          {isContentAbTestOverridden(testName) ? (
            <Tag label="overridden locally" size="sm" appearance="gray" />
          ) : null}
        </Box>
      </Pressable>
      {focused ? <ContentAbTestEdit testName={testName} testValue={testValue} /> : null}
      {!isLast && focused ? <Divider /> : null}
    </Box>
  );
};

export default ContentAbTestDetails;
