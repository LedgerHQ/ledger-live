import { Box, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import { track } from "~/analytics";
import Touchable from "~/components/Touchable";

type SelectionCardProps = {
  title: string;
  text?: string;
  icon: React.ReactElement;

  event: string;
  eventProperties?: Record<string, unknown>;

  onPress: React.ComponentProps<typeof Touchable>["onPress"];

  testID: string;
};

export const SelectionCards = ({ cards }: { cards: SelectionCardProps[] }) => {
  const { space } = useTheme();

  return (
    <>
      {cards.map((props, index) => (
        <Box key={index} mb={cards.length - 1 !== index ? space[6] : 0}>
          <SelectionCard {...props} />
        </Box>
      ))}
    </>
  );
};

export const SelectionCard = ({
  title,
  text,
  icon,
  event,
  eventProperties,
  testID,
  onPress,
}: SelectionCardProps) => {
  const { colors, space } = useTheme();

  const pressAndTrack = () => {
    track(event, eventProperties);
    onPress?.();
  };

  return (
    <Touchable onPress={pressAndTrack} testID={testID}>
      <Flex
        flexDirection="row"
        bg={colors.opacityDefault.c05}
        py={space[7]}
        pr={space[7]}
        pl={space[6]}
        borderRadius={space[4]}
      >
        <Box mr={space[2]}>{icon}</Box>
        <Box pr={space[7]}>
          <CardTitle content={title} />
          <CardText content={text} />
        </Box>
      </Flex>
    </Touchable>
  );
};

const CardTitle = ({ content }: { content: string }) => {
  const { colors } = useTheme();

  return (
    <Text variant="h5" fontWeight="medium" color={colors.neutral.c100} lineHeight="19.8px">
      {content}
    </Text>
  );
};

const CardText = ({ content }: { content?: string }) => {
  const { colors } = useTheme();

  if (!content) return <></>;
  return (
    <Text
      variant="paragraph"
      fontWeight="medium"
      color={colors.opacityDefault.c50}
      mt={"12px"}
      lineHeight="15.73px"
    >
      {content}
    </Text>
  );
};
