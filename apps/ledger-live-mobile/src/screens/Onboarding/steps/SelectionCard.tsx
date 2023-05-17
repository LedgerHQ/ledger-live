import React from "react";
import { useTheme } from "styled-components/native";
import { Flex, Box, Icons, Text } from "@ledgerhq/native-ui";
import { props } from "lodash/fp";
import Touchable from "../../../components/Touchable";

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
  return (
    <Touchable onPress={onPress} {...props}>
      <Flex
        flexDirection="row"
        px={7}
        bg={colors.opacityDefault.c05}
        padding={space[7]}
        borderRadius={space[4]}
      >
        <Box mr={3} pt={1}>
          {Icon}
        </Box>
        <Flex flexDirection="column" justifyContent="center" pr={space[7]}>
          <Text variant="h5" fontWeight="medium" color="neutral.c100" mb={3}>
            {title}
          </Text>

          <Text
            variant="body"
            fontWeight="medium"
            color={colors.opacityDefault.c50}
          >
            {subTitle}
          </Text>
        </Flex>
      </Flex>
    </Touchable>
  );
};
