import React from "react";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import Button from "./Button";

export type InformationaIconType = "error" | "success" | "warning" | "info";

type Props = {
  title: string;
  icon?: React.ReactNode;
  iconType?: InformationaIconType;
  description: string;
  primaryButtonLabel?: string;
  onPrimaryButtonPress?: () => void;
  primaryButtonEvent?: string;
};

/**
 * Renders an informational message (error, warning, success or info) to be rendered as the content inside a drawer.
 *
 * @param title The title of the informational message to be displayed
 * @param icon Icon to display. If set, takes over the `iconType` associated icon. Defaults to undefined.
 * @param iconType The type of icon to display, if `icon` is not defined. Defaults to undefined.
 * @param description The description of the informational message to be displayed
 * @param primaryButtonLabel The label of the primary button. Defaults to undefined.
 * @param onPrimaryButtonPress The callback to be called when the primary button is pressed. Defaults to undefined.
 * @param primaryButtonEvent The event name to be sent when the primary button is pressed. Defaults to undefined.
 */
function GenericInformationalDrawerContent({
  title,
  icon,
  iconType,
  description,
  primaryButtonLabel,
  onPrimaryButtonPress,
  primaryButtonEvent,
}: Props) {
  let renderedIcon = null;

  if (icon) {
    renderedIcon = icon;
  } else if (iconType) {
    let iconName = "";
    let iconColor = "";

    switch (iconType) {
      case "error":
        iconName = "Close";
        iconColor = "red";
        break;
      case "success":
        iconName = "CheckAlone";
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

    if (iconName) {
      renderedIcon = (
        <Icon name={iconName} color={iconColor} size={40} weight="Medium" />
      );
    }
  }

  return (
    <Flex minHeight="280px" paddingX="20px" alignItems="center">
      {renderedIcon ? (
        <Flex
          backgroundColor={"neutral.c100a005"}
          height={64}
          width={64}
          borderRadius={999}
          justifyContent="center"
          alignItems="center"
          mb={4}
        >
          {renderedIcon}
        </Flex>
      ) : (
        <Flex height={16} />
      )}

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

export default GenericInformationalDrawerContent;
