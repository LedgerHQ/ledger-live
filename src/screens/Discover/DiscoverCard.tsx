import React from "react";
import { TouchableOpacityProps } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import Touchable from "../../components/Touchable";
import LedgerLogoRec from "../../icons/LedgerLogoRec";

const DiscoverCard = ({
  title,
  titleProps,
  subTitle,
  subTitleProps,
  labelBadge,
  onPress,
  Image,
  disabled,
  ...props
}: {
  title: string;
  titleProps?: any;
  subTitle?: string;
  subTitleProps?: any;
  labelBadge?: string;
  Image: React.ReactNode;
  onPress: TouchableOpacityProps["onPress"];
  disabled?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <Touchable onPress={onPress} disabled={disabled} {...props}>
      <Flex
        flexDirection={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        bg="neutral.c40"
        borderRadius={8}
        mb={8}
        mx={6}
        overflow="hidden"
        minHeight={130}
        opacity={disabled ? 0.6 : 1}
        position="relative"
      >
        <Flex
          py={7}
          pl={7}
          flex={1}
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          <Flex flexDirection="row" alignItems="center" mb={6}>
            <LedgerLogoRec height={24} width={72} color={colors.neutral.c100} />
            <Text
              ml={5}
              mt={2}
              variant={"h3"}
              fontWeight={"semiBold"}
              color={"neutral.c100"}
              {...titleProps}
            >
              {title}
            </Text>
          </Flex>

          {subTitle && (
            <Text
              variant={"body"}
              fontWeight={"medium"}
              color={"neutral.c70"}
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
            style={{ transform: [{ scale: 1.1 }] }}
          >
            {Image}
          </Flex>
        </Flex>
      </Flex>
      {labelBadge && (
        <Flex position="absolute" top="-10px" right={8}>
          <Text
            variant="tiny"
            px={3}
            py={1}
            mb={2}
            borderRadius={1}
            bg={disabled ? "neutral.c100" : "constant.purple"}
            color={disabled ? "neutral.c00" : "neutral.c100"}
            uppercase
            fontWeight="bold"
          >
            {labelBadge}
          </Text>
        </Flex>
      )}
    </Touchable>
  );
};

export default DiscoverCard;
