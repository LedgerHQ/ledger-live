import React, { useCallback } from "react";
import { useTheme } from "styled-components/native";
import { Flex, Box, Text } from "@ledgerhq/native-ui";
import { props } from "lodash/fp";
import Touchable from "../../../components/Touchable";
import { track } from "../../../analytics";

type CardProps = {
  title: string;
  subTitle: string;
  event: string;
  eventProperties?: Record<string, unknown>;
  testID: string;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  onValidate?: () => void;
  style?: React.CSSProperties;
  Icon?: React.ReactElement;
};

export const SelectionCard = ({
  title,
  subTitle,
  event,
  eventProperties,
  testID,
  onPress,
  Icon,
}: CardProps) => {
  const { colors, space } = useTheme();

  const pressAndTrack = useCallback(() => {
    track(event, eventProperties);
    onPress?.();
  }, [event, eventProperties, onPress]);
  return (
    <Touchable onPress={pressAndTrack} {...props} testID={testID}>
      <Flex
        flexDirection="row"
        bg={colors.opacityDefault.c05}
        py={space[7]}
        pr={space[7]}
        pl={space[6]}
        borderRadius={space[4]}
      >
        <Box mr={4}>{Icon}</Box>
        <Flex flexDirection="column" justifyContent="center" pr={space[7]}>
          <Text
            variant="h5"
            fontWeight="medium"
            color="neutral.c100"
            mb={3}
            lineHeight="19.8px"
            fontSize="18px"
          >
            {title}
          </Text>

          <Text variant="body" fontWeight="medium" color={colors.opacityDefault.c70}>
            {subTitle}
          </Text>
        </Flex>
      </Flex>
    </Touchable>
  );
};
