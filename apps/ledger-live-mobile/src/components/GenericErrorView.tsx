import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Link, Text, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { BluetoothRequired } from "@ledgerhq/errors";
import { NewIconType } from "@ledgerhq/native-ui/components/Icon/type";
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
  withHelp?: boolean;
  hasExportLogButton?: boolean;
  Icon?: NewIconType;
  iconColor?: string;
  children?: React.ReactNode;
  footerComponent?: React.ReactNode;
  exportLogIcon?: typeof IconsLegacy.DownloadMedium | typeof IconsLegacy.ImportMedium;
  exportLogIconPosition?: "left" | "right";

  /*
   * Used when rendering a Bluetooth disabled error
   *
   * If "drawer", the component will be rendered as a content to be rendered in a drawer.
   * If "view", the component will be rendered as a view. Defaults to "view".
   */
  renderedInType?: "drawer" | "view";
};

const StyledLink = styled(Link)`
  margin-top: ${p => p.theme.space[8]};
  margin-bottom: ${p => p.theme.space[4]};
`;

export const ErrorBody: React.FC<{
  Icon?: NewIconType;
  iconColor?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
}> = ({ Icon = Icons.DeleteCircleFill, iconColor = "error.c60", title, subtitle, description }) => {
  return (
    <>
      <Flex justifyContent="center">
        <BoxedIcon
          Icon={Icon}
          backgroundColor={"opacityDefault.c05"}
          variant="circle"
          borderColor="transparent"
          iconSize={"L"}
          size={72}
          iconColor={iconColor}
        />
      </Flex>
      <Text variant={"h4"} fontWeight="semiBold" textAlign={"center"} numberOfLines={3} mt={7}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant={"paragraph"} color="error.c40" numberOfLines={3} mt={6}>
          {subtitle}
        </Text>
      ) : null}
      {description ? (
        <Text
          variant={"bodyLineHeight"}
          color="neutral.c80"
          textAlign="center"
          numberOfLines={6}
          mt={6}
        >
          {description}
        </Text>
      ) : null}
    </>
  );
};

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
  renderedInType = "view",
}: Props) => {
  const { t } = useTranslation();

  const onExport = useExportLogs();

  const titleError = outerError || error;
  const subtitleError = outerError ? error : null;

  // In case bluetooth was necessary but the `RequiresBle` component could not be used directly
  if (error instanceof BluetoothRequired) {
    return (
      <>
        <BluetoothDisabled componentType={renderedInType} />
        {children}
      </>
    );
  }

  return (
    <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch" mt={7}>
      <ErrorBody
        Icon={Icon}
        iconColor={iconColor}
        title={<TranslatedError error={titleError} />}
        subtitle={subtitleError ? <TranslatedError error={subtitleError} /> : null}
        description={withDescription ? <TranslatedError error={error} field="description" /> : null}
      />
      {withDescription && withHelp ? <SupportLinkError error={error} /> : null}
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
