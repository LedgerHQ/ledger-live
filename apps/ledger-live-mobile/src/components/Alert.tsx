import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import styled from "styled-components/native";
import { IconsLegacy, Alert as BaseAlert, Flex } from "@ledgerhq/native-ui";
import { AlertProps as BaseAlertProps } from "@ledgerhq/native-ui/components/message/Alert/index";
import { dismissedBannersSelector } from "~/reducers/settings";

type AlertType =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "hint"
  | "security"
  | "help"
  | "danger"
  | "update";

type IconType = React.ComponentType<{ size?: number; color?: string }>;

type Props = {
  id?: string;
  type: AlertType;
  children?: React.ReactNode;
  title?: string;
  noIcon?: boolean;
  onLearnMore?: () => void;
  learnMoreKey?: string;
  learnMoreTransValues?: object;
  learnMoreUrl?: string;
  learnMoreIsInternal?: boolean;
  learnMoreIcon?: IconType;
  testID?: string;
};

const alertPropsByType: Record<
  AlertType,
  {
    type: BaseAlertProps["type"];
    Icon: BaseAlertProps["Icon"];
  }
> = {
  primary: {
    type: "info",
    Icon: IconsLegacy.InfoMedium,
  },
  secondary: {
    type: "info",
    Icon: IconsLegacy.InfoMedium,
  },
  success: {
    type: "info",
    Icon: IconsLegacy.CircledCheckMedium,
  },
  warning: {
    type: "warning",
    Icon: IconsLegacy.CircledAlertMedium,
  },
  error: {
    type: "error",
    Icon: IconsLegacy.CircledCrossMedium,
  },
  hint: {
    type: "info",
    Icon: IconsLegacy.LightbulbMedium,
  },
  security: {
    type: "warning",
    Icon: IconsLegacy.ShieldSecurityMedium,
  },
  help: {
    type: "info",
    Icon: IconsLegacy.ShieldSecurityMedium,
  },
  danger: {
    type: "error",
    Icon: IconsLegacy.ShieldSecurityMedium,
  },
  update: {
    type: "warning",
    Icon: IconsLegacy.WarningMedium,
  },
};

type LearnMoreLinkProps = {
  onPress?: () => void;
  learnMoreIsInternal?: boolean;
  learnMoreKey?: string;
  Icon?: IconType;
  transValues?: object;
};

const LinkTouchable = styled(TouchableOpacity).attrs({
  activeOpacity: 0.5,
})`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

export const LearnMoreLink = ({
  onPress,
  learnMoreIsInternal,
  learnMoreKey,
  transValues,
  Icon,
}: LearnMoreLinkProps) => {
  const IconComponent = Icon || IconsLegacy.ExternalLinkMedium;
  return (
    <LinkTouchable onPress={onPress}>
      <BaseAlert.UnderlinedText mr="5px">
        <Trans i18nKey={learnMoreKey || "common.learnMore"} values={transValues} />
      </BaseAlert.UnderlinedText>
      {(Icon || !learnMoreIsInternal) && <IconComponent size={16} />}
    </LinkTouchable>
  );
};

const Container = styled(Flex).attrs({
  width: "100%",
  flexDirection: "column",
  flex: 1,
  alignItems: "flex-start",
})``;

export default function Alert(props: Props) {
  const {
    id,
    type = "secondary",
    children: description,
    title,
    noIcon,
    onLearnMore,
    learnMoreUrl,
    learnMoreKey,
    learnMoreIsInternal = false,
    learnMoreIcon,
    learnMoreTransValues,
    testID,
  } = props;

  const dismissedBanners = useSelector(dismissedBannersSelector);

  const alertProps = useMemo(
    () => ({
      ...alertPropsByType[type],
      showIcon: !noIcon,
    }),
    [type, noIcon],
  );

  const hasLearnMore = !!onLearnMore || !!learnMoreUrl;
  const handleLearnMore = useCallback(
    () => (onLearnMore ? onLearnMore() : learnMoreUrl ? Linking.openURL(learnMoreUrl) : undefined),
    [onLearnMore, learnMoreUrl],
  );

  const isDismissed = useMemo(
    () => (id ? dismissedBanners.includes(id) : false),
    [dismissedBanners, id],
  );

  return !isDismissed ? (
    <BaseAlert {...alertProps}>
      <Container testID={testID}>
        {title && <BaseAlert.BodyText testID={`${testID}-title`}>{title}</BaseAlert.BodyText>}
        {description && (
          <BaseAlert.BodyText
            testID={`${testID}-description`}
            mt={title ? 2 : undefined}
            mb={hasLearnMore ? 2 : undefined}
          >
            {description}
          </BaseAlert.BodyText>
        )}
        {hasLearnMore && (
          <LearnMoreLink
            onPress={handleLearnMore}
            learnMoreKey={learnMoreKey}
            learnMoreIsInternal={learnMoreIsInternal}
            Icon={learnMoreIcon}
            transValues={learnMoreTransValues}
          />
        )}
      </Container>
    </BaseAlert>
  ) : null;
}
