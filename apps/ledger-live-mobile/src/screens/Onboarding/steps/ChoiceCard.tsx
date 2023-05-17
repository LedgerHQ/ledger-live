import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { TFunction } from "i18next";
import Touchable from "../../../components/Touchable";

export type Props = {
  title: string;
  notCompatible?: boolean;
  subtitleElement?: React.ReactNode;
  Image: React.ReactNode;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  event?: string;
  eventProperties?: Record<string, unknown>;
  testID?: string;
  imageContainerProps?: Partial<FlexBoxProps>;
  t: TFunction;
};

const ChoiceCard = ({
  title,
  subtitleElement,
  notCompatible = false,
  onPress,
  Image,
  imageContainerProps,
  t,
  ...props
}: Props) => (
  <Touchable onPress={onPress} {...props}>
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      bg="neutral.c20"
      borderRadius={8}
      overflow="hidden"
      minHeight={130}
      opacity={notCompatible ? 0.6 : 1}
      position="relative"
      mb={6}
    >
      <Flex
        py={7}
        pl={7}
        flex={1}
        justifyContent="flex-start"
        alignItems="flex-start"
        flexDirection={"column"}
      >
        <Text
          mt={2}
          variant={"paragraphLineHeight"}
          fontWeight={"semiBold"}
          color={"neutral.c60"}
        >
          {t("syncOnboarding.deviceSelection.brand")}
        </Text>

        <Text variant={"h5"} fontWeight={"semiBold"} color={"neutral.c100"}>
          {title}
        </Text>

        {notCompatible ? (
          <Text
            mt={2}
            variant="paragraph"
            fontWeight="medium"
            color={"neutral.c100"}
          >
            {t("syncOnboarding.deviceSelection.notCompatible")}
          </Text>
        ) : null}
      </Flex>
      <Flex height="100%" overflow="hidden" width={150} alignItems="flex-end">
        <Flex
          position="absolute"
          right={0}
          height="100%"
          alignItems={"flex-end"}
          justifyContent={"flex-end"}
          {...imageContainerProps}
        >
          {Image}
        </Flex>
      </Flex>
    </Flex>
  </Touchable>
);

export default ChoiceCard;
