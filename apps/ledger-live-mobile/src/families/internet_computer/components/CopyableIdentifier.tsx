import { Flex, Text } from "@ledgerhq/native-ui";
import CopyButton from "LLM/components/CopyButton";
import React from "react";

type Props = {
  text: string;
  testID?: string;
  copyTestID?: string;
};

/**
 * A long identifier with the control that lifts it, shortened from the middle.
 *
 * Middle rather than end truncation: a neuron id is a random u64, so two of them can share a long
 * prefix and the tail is what says which one this is.
 */
export const CopyableIdentifier = ({ text, testID, copyTestID }: Props) => (
  <Flex flexDirection="row" alignItems="center" style={{ gap: 8 }}>
    <Flex flex={1}>
      <Text
        variant="body"
        fontWeight="semiBold"
        color="neutral.c100"
        numberOfLines={1}
        ellipsizeMode="middle"
        testID={testID}
      >
        {text}
      </Text>
    </Flex>
    <CopyButton text={text} size="small" type="shade" testID={copyTestID} />
  </Flex>
);
