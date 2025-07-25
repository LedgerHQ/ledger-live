import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Link } from "@ledgerhq/native-ui";
import { BluetoothRequired, PeerRemovedPairing } from "@ledgerhq/errors";
import { NewIconType } from "@ledgerhq/native-ui/components/Icon/type";
import useExportLogs from "./useExportLogs";
import TranslatedError from "./TranslatedError";
import SupportLinkError from "./SupportLinkError";
import BluetoothDisabled from "./RequiresBLE/BluetoothDisabled";
import { GenericInformationBody } from "./GenericInformationBody";
import { DmkError, isDmkError, isiOSPeerRemovedPairingError } from "@ledgerhq/live-dmk-mobile";

type Props = {
  error: Error | DmkError;
  // sometimes we want to "hide" the technical error into a category
  // for instance, for Genuine check we want to express "Genuine check failed" because "<actual error>"
  // in such case, the outerError is GenuineCheckFailed and the actual error is still error
  outerError?: Error | DmkError | null;
  withDescription?: boolean;
  withHelp?: boolean;
  hasExportLogButton?: boolean;
  Icon?: NewIconType;
  iconColor?: string;
  children?: React.ReactNode;
  footerComponent?: React.ReactNode;
  exportLogIcon?: typeof IconsLegacy.DownloadMedium | typeof IconsLegacy.ImportMedium;
  exportLogIconPosition?: "left" | "right";
};

const StyledLink = styled(Link)`
  margin-top: ${p => p.theme.space[8]}px;
  margin-bottom: ${p => p.theme.space[4]}px;
`;

const GenericErrorView = ({
  error,
  outerError,
  withDescription = true,
  withHelp = true,
  hasExportLogButton = true,
  children,
  Icon,
  iconColor,
  footerComponent,
  exportLogIcon = IconsLegacy.DownloadMedium,
  exportLogIconPosition = "left",
}: Props) => {
  const { t } = useTranslation();

  const onExport = useExportLogs();

  const dmkiOSPeerRemovedPairingError = isDmkError(error) && isiOSPeerRemovedPairingError(error);
  const currentError = dmkiOSPeerRemovedPairingError ? new PeerRemovedPairing() : error;

  const titleError = outerError || currentError;
  const subtitleError = outerError ? currentError : null;

  // In case bluetooth was necessary but the `RequiresBle` component could not be used directly
  if (error instanceof BluetoothRequired) {
    return (
      <>
        <BluetoothDisabled />
        {children}
      </>
    );
  }

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch" mt={7}>
      <GenericInformationBody
        Icon={Icon}
        iconColor={iconColor}
        title={<TranslatedError error={titleError} />}
        subtitle={subtitleError ? <TranslatedError error={subtitleError} /> : null}
        description={
          withDescription ? <TranslatedError error={currentError} field="description" /> : null
        }
      />
      {withDescription && withHelp ? <SupportLinkError error={currentError} /> : null}
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
