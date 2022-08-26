import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Box, Flex, IconBox, Icons, Link, Text } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { BluetoothRequired } from "@ledgerhq/errors";
import { IconOrElementType } from "@ledgerhq/native-ui/components/Icon/type";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import { promptBluetooth } from "../logic/bluetoothHelper";

type Props = {
  error: Error;
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: Error;
  withDescription?: boolean;
  withIcon?: boolean;
  hasExportLogButton?: boolean;
  Icon?: IconOrElementType;
  iconColor?: string;
  children?: React.ReactNode;
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
  hasExportLogButton = true,
  children,
  Icon = CloseMedium,
  iconColor = "error.c100",
}: Props) => {
  useEffect(() => {
    if (error instanceof BluetoothRequired) {
      promptBluetooth().catch(() => {
        /* ignore */
      });
    }
  }, [error]);

  const { t } = useTranslation();

  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
      {withIcon ? (
        <Box mb={7}>
          <IconBox Icon={Icon} iconSize={24} boxSize={64} color={iconColor} />
        </Box>
      ) : null}
      <Text variant={"h2"} textAlign={"center"} numberOfLines={3} mb={3}>
        <TranslatedError error={titleError} />
      </Text>
      {subtitleError ? (
        <Text variant={"paragraph"} color="error.c80" numberOfLines={3} mb={3}>
          <TranslatedError error={subtitleError} />
        </Text>
      ) : null}
      {withDescription ? (
        <>
          <Text
            variant={"bodyLineHeight"}
            color="neutral.c80"
            textAlign="center"
            numberOfLines={6}
          >
            <TranslatedError error={error} field="description" />
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
