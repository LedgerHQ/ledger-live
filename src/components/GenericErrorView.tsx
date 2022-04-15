import React from "react";
import { Trans } from "react-i18next";
import { Box, Button, Flex, IconBox, Text } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import DownloadFileIcon from "../icons/DownloadFile";
import { IconOrElementType } from "@ledgerhq/native-ui/components/Icon/type";

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  withIcon = true,
  hasExportLogButton = true,
  Icon = CloseMedium,
  iconColor = "error.c100"
}: {
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
}) => {
  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
      {withIcon ? (
        <Box mb={7}>
          <IconBox
            Icon={Icon}
            iconSize={24}
            boxSize={64}
            color={iconColor}
          />
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
            numberOfLines={6}
          >
            <TranslatedError error={error} field="description" />
          </Text>
          <SupportLinkError error={error} />
        </>
      ) : null}
      {hasExportLogButton ? (
        <>
          <Button
            alignSelf="stretch"
            type={"main"}
            outline={true}
            Icon={DownloadFileIcon}
            onPress={onExport}
            mt={32}
          >
            <Trans i18nKey="common.saveLogs" />
          </Button>
        </>
      ) : null}
    </Flex>
  );
};

export default GenericErrorView;
