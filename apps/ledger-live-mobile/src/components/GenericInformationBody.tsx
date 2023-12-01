import React from "react";
import { Flex, Text, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { NewIconType } from "@ledgerhq/native-ui/components/Icon/type";

/**
 * Component rendering an icon, a title, a subtitle and a description.
 */
export const GenericInformationBody: React.FC<{
  Icon?: NewIconType;
  iconColor?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
}> = ({ Icon = Icons.DeleteCircleFill, iconColor = "error.c60", title, subtitle, description }) => {
  return (
    <Flex px={"7"}>
      <Flex justifyContent="center" alignSelf="center">
        <BoxedIcon
          Icon={Icon}
          backgroundColor={"opacityDefault.c05"}
          variant="circle"
          borderColor="transparent"
          iconSize={"L"}
          size={72}
          iconColor={iconColor}
        />
      </Flex>
      <Text
        alignSelf="center"
        variant={"h4"}
        fontWeight="semiBold"
        textAlign={"center"}
        numberOfLines={3}
        mt={7}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text alignSelf="center" variant={"paragraph"} color="error.c40" numberOfLines={3} mt={6}>
          {subtitle}
        </Text>
      ) : null}
      {description ? (
        <Text
          alignSelf="center"
          variant={"bodyLineHeight"}
          color="neutral.c80"
          textAlign="center"
          numberOfLines={6}
          mt={6}
        >
          {description}
        </Text>
      ) : null}
    </Flex>
  );
};
