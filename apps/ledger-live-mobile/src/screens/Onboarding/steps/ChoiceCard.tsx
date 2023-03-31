import React from "react";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text/index";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import Touchable from "../../../components/Touchable";

export type Props = {
  title: string;
  titleProps?: Partial<BaseTextProps>;
  labelBadge?: string;
  subtitleElement?: React.ReactNode;
  Image: React.ReactNode;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  disabled?: boolean;
  event?: string;
  eventProperties?: Record<string, unknown>;
  testID?: string;
  imageContainerProps?: Partial<FlexBoxProps>;
};

const ChoiceCard = ({
  title,
  titleProps,
  subtitleElement,
  labelBadge,
  onPress,
  Image,
  disabled,
  imageContainerProps,
  ...props
}: Props) => (
  <Touchable onPress={onPress} disabled={disabled} {...props}>
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      bg="neutral.c20"
      borderRadius={8}
      overflow="hidden"
      minHeight={130}
      opacity={disabled ? 0.6 : 1}
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
        <Flex flexDirection="row" alignItems="center" mb={3}>
          <Text
            mt={2}
            variant={"h2"}
            fontWeight={"semiBold"}
            color={"neutral.c100"}
            {...titleProps}
          >
            {title}
          </Text>
        </Flex>
        {subtitleElement ?? null}
        {labelBadge ? (
          <Tag type="shade" uppercase={false} size="small">
            {labelBadge}
          </Tag>
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
