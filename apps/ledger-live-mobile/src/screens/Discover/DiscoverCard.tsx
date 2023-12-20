import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text/index";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import Touchable from "~/components/Touchable";

const DiscoverCard = ({
  title,
  titleProps,
  subTitle,
  subTitleProps,
  labelBadge,
  onPress,
  Image,
  disabled,
  cardProps,
  imageContainerProps,
  subtitleFirst,
  ...props
}: {
  title: string;
  titleProps?: Partial<BaseTextProps>;
  subTitle?: string;
  subTitleProps?: Partial<BaseTextProps>;
  labelBadge?: string;
  Image: React.ReactNode;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  disabled?: boolean;
  event?: string;
  eventProperties?: Record<string, unknown>;
  testID?: string;
  cardProps?: Partial<FlexBoxProps>;
  imageContainerProps?: Partial<FlexBoxProps>;
  subtitleFirst?: boolean;
}) => (
  <Touchable onPress={onPress} disabled={disabled} {...props}>
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      bg="neutral.c30"
      borderRadius={8}
      mb={6}
      mx={6}
      overflow="hidden"
      minHeight={130}
      opacity={disabled ? 0.6 : 1}
      position="relative"
      {...cardProps}
    >
      <Flex
        py={7}
        pl={7}
        flex={1}
        justifyContent="flex-start"
        alignItems="flex-start"
        flexDirection={subtitleFirst ? "column-reverse" : "column"}
      >
        <Flex flexDirection="row" alignItems="center" mb={subtitleFirst ? 0 : 3}>
          <Text
            mt={2}
            variant={"h5"}
            fontWeight={"semiBold"}
            color={"neutral.c100"}
            {...titleProps}
          >
            {title}
          </Text>
        </Flex>
        {subTitle && (
          <Text
            mb={subtitleFirst ? 2 : 0}
            variant={"bodyLineHeight"}
            fontWeight={"medium"}
            color={"neutral.c80"}
            {...subTitleProps}
          >
            {subTitle}
          </Text>
        )}
      </Flex>
      <Flex height="100%" overflow="hidden" width={150} alignItems="flex-end">
        <Flex
          position="absolute"
          bottom={"-3px"}
          right={0}
          height="100%"
          alignItems={"flex-end"}
          justifyContent={"flex-end"}
          style={{ transform: [{ scale: 1.1 }] }}
          {...imageContainerProps}
        >
          {Image}
        </Flex>
      </Flex>
    </Flex>
    {labelBadge && (
      <Flex position="absolute" top="16px" right="16px">
        <Text
          variant="small"
          px={3}
          py={1}
          mb={2}
          borderRadius={1}
          bg={disabled ? "neutral.c100" : "constant.purple"}
          color={disabled ? "neutral.c00" : "constant.black"}
          fontWeight="bold"
        >
          {labelBadge}
        </Text>
      </Flex>
    )}
  </Touchable>
);

export default DiscoverCard;
