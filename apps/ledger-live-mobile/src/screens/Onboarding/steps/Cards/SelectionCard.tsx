import { Box, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import { track } from "../../../../analytics";
import Touchable from "../../../../components/Touchable";

type SelectionCardProps = {
  title: string;
  text?: string;
  icon: React.ReactElement;

  event: string;
  eventProperties?: Record<string, unknown>;

  onPress: React.ComponentProps<typeof Touchable>["onPress"];

  testID: string;
};

export const SelectionCards = ({ cards }: { cards: SelectionCardProps[] }) => (
  <>
    {cards.map((props, index) => (
      <Box key={index} mb={cards.length - 1 !== index ? 6 : 0}>
        <SelectionCard {...props} />
      </Box>
    ))}
  </>
);

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
        <Box mr={4}>{icon}</Box>
        <Flex flexGrow={1} flexDirection="column" pr={space[7]}>
          <CardTitle content={title} />
          <CardText content={text} />
        </Flex>
      </Flex>
    </Touchable>
  );
};

const CardTitle = ({ content }: { content: string }) => {
  const { colors } = useTheme();

  return (
    <Text variant="h5" fontWeight="semiBold" color={colors.neutral.c100}>
      {content}
    </Text>
  );
};

const CardText = ({ content }: { content?: string }) => {
  const { colors } = useTheme();

  if (!content) return <></>;
  return (
    <Text variant="body" fontWeight="medium" color={colors.opacityDefault.c70} mt={4}>
      {content}
    </Text>
  );
};
