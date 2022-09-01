import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NativeModules } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { Box, Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { BluetoothRequired } from "@ledgerhq/errors";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";

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
      NativeModules.BluetoothHelperModule.prompt().catch(() => {
        /* ignore */
      });
    }
  }, [error]);

  const { t } = useTranslation();

  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  const { space } = useTheme();

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
      {withIcon ? (
        <Box mb={7}>
          <Flex
            backgroundColor={iconColor}
            height={space[10]}
            width={space[10]}
            borderRadius={999}
            justifyContent="center"
            alignItems="center"
          >
            <Icon size={24} color="neutral.c00" />
          </Flex>
        </Box>
      ) : null}
      <Text
        variant={"h4"}
        fontWeight="semiBold"
        textAlign={"center"}
        numberOfLines={3}
        mb={6}
      >
        <TranslatedError error={titleError} />
      </Text>
      {subtitleError ? (
        <Text variant={"paragraph"} color="error.c80" numberOfLines={3} mb={6}>
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
