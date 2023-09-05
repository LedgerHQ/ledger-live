import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import Button from "./Button";
import { GenericInformationBody } from "./GenericInformationBody";

export type InformationaIconType = "error" | "success" | "warning" | "info";

type Props = {
  title: string;
  icon: React.ReactElement;
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
  description,
  primaryButtonLabel,
  onPrimaryButtonPress,
  primaryButtonEvent,
}: Props) {
  return (
    <Flex alignItems="center" alignSelf={"stretch"}>
      <GenericInformationBody Icon={() => icon} title={title} description={description} />
      {primaryButtonLabel ? (
        <Button
          mt={8}
          alignSelf="stretch"
          size="large"
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
