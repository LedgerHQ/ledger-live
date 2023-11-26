import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";
import { GenericInformationBody } from "./GenericInformationBody";

type Props = {
  title: string;
  icon: React.ReactElement;
  description: string;
  subTitle?: string;
  primaryButtonLabel: string;
  onPrimaryButtonPress: () => void;
  primaryButtonEvent?: string;
};

/**
 * View component used to display an informational (error, warning, info) message to the user
 *
 * Used for example by BluetoothPermissionsDenied and BluetoothDisabled error components
 *
 * Can be updated to add more fields (second button etc.)
 *
 * @param title String displayed as a title on the view
 * @param icon Icon displayed above the title
 * @param description String displayed as a text content on the view
 * @param subTitle String displayed as a subtitle (below description) on the view
 * @param primaryButtonLabel String displayed as the text on the button
 * @param onPrimaryButtonPress A function called when the user press on the (retry) button
 * @param primaryButtonEvent Event triggered when the user press on the button
 */
const GenericInformationalView: React.FC<Props> = ({
  title,
  icon,
  description,
  subTitle,
  primaryButtonLabel,
  onPrimaryButtonPress,
  primaryButtonEvent,
}) => {
  return (
    <Flex flexDirection="column" alignSelf="stretch" flexGrow={1} flexShrink={0} mx={4}>
      <Flex alignItems="center" justifyContent="center" flexGrow={1}>
        <GenericInformationBody Icon={() => icon} title={title} description={subTitle} />
        {description ? (
          <Text
            variant={"bodyLineHeight"}
            color="neutral.c80"
            mt={6}
            textAlign="center"
            numberOfLines={5}
          >
            {description}
          </Text>
        ) : null}
      </Flex>

      <Flex mt={8} mb={9} flexDirection="column">
        <Button type="main" size="large" onPress={onPrimaryButtonPress} event={primaryButtonEvent}>
          {primaryButtonLabel}
        </Button>
      </Flex>
    </Flex>
  );
};

export default GenericInformationalView;
