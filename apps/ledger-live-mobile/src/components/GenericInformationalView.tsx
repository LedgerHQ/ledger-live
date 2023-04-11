import React from "react";
import { Box, Text, Flex } from "@ledgerhq/native-ui";
import Button from "./wrappedUi/Button";

type Props = {
  title: string;
  icon?: React.ReactNode;
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
    <Flex flexDirection="column" alignSelf="stretch" flex={1} mx={4}>
      <Flex alignItems="center" justifyContent="center" flexGrow={1}>
        <Box mb={7}>
          <Flex
            backgroundColor={"neutral.c100a005"}
            height={64}
            width={64}
            borderRadius={999}
            justifyContent="center"
            alignItems="center"
          >
            {icon}
          </Flex>
        </Box>

        <Text
          color="neutral.c100"
          fontSize={7}
          fontWeight="semiBold"
          mb={6}
          numberOfLines={3}
          textAlign={"center"}
          variant={"h4"}
        >
          {title}
        </Text>

        {subTitle ? (
          <Text
            variant={"bodyLineHeight"}
            textAlign="center"
            color="neutral.c70"
            numberOfLines={3}
            mb={6}
          >
            {subTitle}
          </Text>
        ) : null}

        {description ? (
          <>
            <Text
              variant={"bodyLineHeight"}
              color="neutral.c70"
              fontSize={4}
              textAlign="center"
              numberOfLines={5}
            >
              {description}
            </Text>
          </>
        ) : null}
      </Flex>

      <Flex mt={8} mb={9} flexDirection="column">
        <Button
          type="main"
          onPress={onPrimaryButtonPress}
          event={primaryButtonEvent}
        >
          <Text variant="body" color="neutral.c00" fontSize={5}>
            {primaryButtonLabel}
          </Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default GenericInformationalView;
