import React from "react";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import Button from "./Button";

export type InformationalMessageIconType =
  | "error"
  | "success"
  | "warning"
  | "info";

type Props = {
  title: string;
  iconType?: InformationalMessageIconType;
  description: string;
  primaryButtonLabel?: string;
  onPrimaryButtonPress?: () => void;
  primaryButtonEvent?: string;
};

/**
 * Renders an informational message (error, warning, success or info) to be rendered as the content inside a drawer.
 *
 * @param title The title of the informational message to be displayed
 * @param iconType The type of icon to display. Defaults to undefined.
 * @param description The description of the informational message to be displayed
 * @param primaryButtonLabel The label of the primary button. Defaults to undefined.
 * @param onPrimaryButtonPress The callback to be called when the primary button is pressed. Defaults to undefined.
 * @param primaryButtonEvent The event name to be sent when the primary button is pressed. Defaults to undefined.
 */
function InformationalMessageDrawerContent({
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

export default InformationalMessageDrawerContent;
