import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { Flex, IconsLegacy, Link, Text, BoxedIcon } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { BluetoothRequired } from "@ledgerhq/errors";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import BluetoothDisabled from "./RequiresBLE/BluetoothDisabled";

type Props = {
  error: Error;
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: Error | null;
  withDescription?: boolean;
  withIcon?: boolean;
  withHelp?: boolean;
  hasExportLogButton?: boolean;
  Icon?: IconType;
  iconColor?: string;
  children?: React.ReactNode;
  footerComponent?: React.ReactNode;
  exportLogIcon?: typeof IconsLegacy.DownloadMedium | typeof IconsLegacy.ImportMedium;
  exportLogIconPosition?: "left" | "right";
};

const StyledLink = styled(Link)`
  margin-top: 32px;
  margin-bottom: 10px;
`;

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  withHelp = true,
  withIcon = true,
  hasExportLogButton = true,
  children,
  Icon = CloseMedium,
  iconColor = "error.c60",
  footerComponent,
  exportLogIcon = IconsLegacy.DownloadMedium,
  exportLogIconPosition = "left",
}: Props) => {
  const { t } = useTranslation();

  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  const { colors } = useTheme();

  // To avoid regression, but this case should not happen if RequiresBle component is correctly used.
  if (error instanceof BluetoothRequired) {
    return <BluetoothDisabled />;
  }

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
      {withIcon ? (
        <Flex height={100} justifyContent="center">
          <BoxedIcon
            Icon={Icon}
            backgroundColor={colors.opacityDefault.c05}
            size={64}
            variant="circle"
            borderColor="transparent"
            iconSize={32}
            iconColor={iconColor}
          />
        </Flex>
      ) : null}
      <Text
        variant={"h4"}
        fontWeight="semiBold"
        textAlign={"center"}
        numberOfLines={3}
        mb={2}
        mt={24}
      >
        <TranslatedError error={titleError} />
      </Text>
      {subtitleError ? (
        <Text variant={"paragraph"} color="error.c40" numberOfLines={3} mb={6}>
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
            mt={5}
          >
            <TranslatedError error={error} field="description" />
          </Text>
          {withHelp ? <SupportLinkError error={error} /> : null}
        </>
      ) : null}
      {children}
      {hasExportLogButton ? (
        <StyledLink Icon={exportLogIcon} onPress={onExport} iconPosition={exportLogIconPosition}>
          {t("common.saveLogs")}
        </StyledLink>
      ) : null}
      {footerComponent}
    </Flex>
  );
};

export default memo<Props>(GenericErrorView);
