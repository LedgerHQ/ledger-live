import React from "react";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import Button from "./Button";

export type GenericBottomModalContentIconType =
  | "error"
  | "success"
  | "warning"
  | "info";

type Props = {
  title: string;
  iconType?: GenericBottomModalContentIconType;
  description: string;
  primaryButtonLabel?: string;
  onPrimaryButtonPress: () => void;
  primaryButtonEvent?: string;
};

/**
 * Renders the content that is rendered inside a bottom modal/drawer.
 */
function GenericDrawerContent({
  title,
  iconType,
  description,
  primaryButtonLabel,
  onPrimaryButtonPress,
  primaryButtonEvent,
}: Props) {
  let iconName = "";
  let iconColor = "";

  switch (iconType) {
    case "error":
      iconName = "CircledCross";
      iconColor = "red";
      break;
    case "success":
      iconName = "CircledCheck";
      iconColor = "green";
      break;
    case "warning":
      iconName = "Warning";
      iconColor = "yellow";
      break;
    case "info":
      iconName = "Info";
      break;
    default:
      break;
  }

  return (
    <Flex minHeight="280px" paddingX="20px" alignItems="center">
      {iconName ? (
        <Flex mb={4}>
          <Icon name={iconName} color={iconColor} size={40} weight="Medium" />
        </Flex>
      ) : null}
      <Text variant="h4" textAlign="center" color="neutral.c100" mb={4}>
        {title}
      </Text>

      <Text
        mb={10}
        variant={"body"}
        fontWeight={"medium"}
        textAlign="center"
        color={"neutral.c80"}
      >
        {description}
      </Text>

      {primaryButtonLabel ? (
        <Button
          type="main"
          onPress={onPrimaryButtonPress}
          outline
          iconPosition="left"
          event={primaryButtonEvent}
        >
          {primaryButtonLabel}
        </Button>
      ) : null}
    </Flex>
  );
}

export default GenericDrawerContent;
