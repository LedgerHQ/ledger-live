import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Box, Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import { BluetoothRequired } from "@ledgerhq/errors";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import { usePromptBluetoothCallback } from "../logic/usePromptBluetoothCallback";
import ErrorIcon from "./ErrorIcon";

type Props = {
  error: Error;
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: Error | null;
  withDescription?: boolean;
  withIcon?: boolean;
  hasExportLogButton?: boolean;
  Icon?: IconType;
  iconColor?: string;
  children?: React.ReactNode;
  args?: { [key: string]: string };
};

const StyledLink = styled(Link).attrs({
  iconPosition: "left",
})`
  margin-top: 32px;
  margin-bottom: 10px;
`;

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  withIcon = true,
  args,
  hasExportLogButton = true,
  children,
}: Props) => {
  const promptBluetooth = usePromptBluetoothCallback();
  useEffect(() => {
    if (error instanceof BluetoothRequired) {
      promptBluetooth().catch(() => {
        /* ignore */
      });
    }
  }, [promptBluetooth, error]);

  const { t } = useTranslation();

  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
      {withIcon ? (
        <Box mb={7}>
          <ErrorIcon error={error} />
        </Box>
      ) : null}
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
            numberOfLines={6}
          >
            <TranslatedError error={error} field="description" args={args} />
          </Text>
          <SupportLinkError error={error} />
        </>
      ) : null}
      {children}
      {hasExportLogButton ? (
        <StyledLink Icon={Icons.DownloadMedium} onPress={onExport}>
          {t("common.saveLogs")}
        </StyledLink>
      ) : null}
    </Flex>
  );
};

export default memo<Props>(GenericErrorView);
