import { Box, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, ImageSourcePropType } from "react-native";
import { useTheme } from "styled-components/native";
import { track } from "~/analytics";
import Touchable from "~/components/Touchable";

type DeviceCardProps = {
  title: string;
  img: ImageSourcePropType;

  compatible: boolean;

  event: string;
  eventProperties?: Record<string, unknown>;

  onPress: React.ComponentProps<typeof Touchable>["onPress"];

  testID?: string;
};

export const DeviceCards = ({ cards }: { cards: DeviceCardProps[] }) => {
  const { space } = useTheme();

  return (
    <>
      {cards.map((card, index) => (
        <Box key={index} mb={cards.length - 1 !== index ? space[6] : 0}>
          <DeviceCard {...card} />
        </Box>
      ))}
    </>
  );
};

const DeviceCard = ({
  title,
  compatible,
  onPress,
  img,
  event,
  eventProperties,
  testID,
}: DeviceCardProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const pressAndTrack = () => {
    track(event, eventProperties);
    onPress?.();
  };

  return (
    <Touchable onPress={pressAndTrack} testID={testID}>
      <Flex
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        bg={colors.opacityDefault.c05}
        borderRadius={8}
        height={133}
        opacity={compatible ? 1 : 0.25}
      >
        <Flex pl={7}>
          <CardHeader content={t("syncOnboarding.deviceSelection.brand")} />
          <CardTitle content={title} />
          {!compatible && <CardText content={t("syncOnboarding.deviceSelection.notCompatible")} />}
        </Flex>

        <Box mr={7}>
          <Image source={img} style={{ height: "100%", aspectRatio: 1 }} />
        </Box>
      </Flex>
    </Touchable>
  );
};

const CardHeader = ({ content }: { content: string }) => {
  const { colors } = useTheme();

  return (
    <Text mt={2} variant="paragraphLineHeight" fontWeight="medium" color={colors.neutral.c60}>
      {content}
    </Text>
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

const CardText = ({ content }: { content: string }) => {
  const { colors } = useTheme();

  return (
    <Text mt={2} variant="paragraph" fontWeight="medium" color={colors.neutral.c100}>
      {content}
    </Text>
  );
};

export default DeviceCard;
