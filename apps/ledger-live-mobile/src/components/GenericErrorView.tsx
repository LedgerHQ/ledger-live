import React, { memo, useCallback } from "react";
import { Box, Button, Flex, Text } from "@ledgerhq/native-ui";
import { View } from "react-native";
import { useTheme } from "styled-components/native";

import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import ExportLogsButton from "./ExportLogsButton";
import useErrorRenderData from "../hooks/useErrorRenderData";

/**
 * sometimes we want to "hide" the technical error into a category
 * for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
 * in such case, the outerError is GenuineCheckFailed and the actual error is still error
 */
type Props = {
  error: Error;
  outerError?: Error | null;
  withDescription?: boolean;
  iconColor?: string;
  isModal?: boolean;
  args?: { [key: string]: string | number | null };

  onPrimaryPress?: (() => void) | null;
};

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  args,
  isModal = false,
  onPrimaryPress,
}: Props) => {
  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  const { space } = useTheme();
  const { Icon, iconColor, hasExportLogs, onPrimaryPressOverride } =
    useErrorRenderData(error);

  /**
   * Some errors can specify an override for the main button callback. We need to consider
   * that this component can be rendered from inside a DeviceAction which will pass the
   * `onRetry` callback by default, this allows us to navigate elsewhere, open a link, app
   * settings, etc.
   * */
  const onWrappedPrimaryPress = useCallback(() => {
    if (onPrimaryPressOverride) {
      onPrimaryPressOverride();
    } else {
      onPrimaryPress && onPrimaryPress();
    }
  }, [onPrimaryPress, onPrimaryPressOverride]);

  return (
    <Flex
      flexDirection="column"
      alignSelf="stretch"
      flex={isModal ? undefined : 1}
    >
      <Flex alignItems="center" justifyContent="center" flexGrow={1}>
        <Box mb={7}>
          <Flex
            backgroundColor={"neutral.c100a005"}
            height={space[11]}
            width={space[11]}
            borderRadius={999}
            justifyContent="center"
            alignItems="center"
          >
            <Icon size={30} color={iconColor} />
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
          <TranslatedError error={titleError} args={args} />
        </Text>

        {subtitleError ? (
          <Text
            variant={"bodyLineHeight"}
            color="neutral.c70"
            numberOfLines={3}
            mb={6}
          >
            <TranslatedError error={subtitleError} args={args} />
          </Text>
        ) : null}

        {withDescription ? (
          <>
            <Text
              variant={"bodyLineHeight"}
              color="neutral.c70"
              fontSize={4}
              textAlign="center"
              numberOfLines={5}
            >
              <TranslatedError error={error} field="description" args={args} />
            </Text>
            <SupportLinkError error={error} />
          </>
        ) : null}
      </Flex>

      <Flex mt={8} flexDirection="column">
        <Button type="main" onPress={onWrappedPrimaryPress}>
          <Text variant="body" color="neutral.c00" fontSize={5}>
            <TranslatedError error={error} field="primaryCTA" />
          </Text>
        </Button>
        <View style={{ height: 16 }} />
        {hasExportLogs ? <ExportLogsButton /> : null}
      </Flex>
    </Flex>
  );
};

export default memo<Props>(GenericErrorView);
