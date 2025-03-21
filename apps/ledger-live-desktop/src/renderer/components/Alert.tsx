import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { css, DefaultTheme, ThemedStyledProps } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "~/renderer/styles/theme";
import { openURL } from "~/renderer/linking";
import { dismissedBannersSelector } from "~/renderer/reducers/settings";
import { dismissBanner } from "~/renderer/actions/settings";
import Box from "./Box";
import Text from "./Text";
import IconCross from "~/renderer/icons/Cross";
import InfoCircle from "../icons/InfoCircle";
import CheckCircle from "../icons/CheckCircle";
import Shield from "../icons/Shield";
import ExclamationCircle from "../icons/ExclamationCircle";
import CrossCircle from "../icons/CrossCircle";
import LightBulb from "../icons/LightBulb";
import Twitter from "../icons/Twitter";
import ExternalLink from "./ExternalLink";
import { BoxProps } from "./Box/Box";

const getIcon = (type: AlertType) => {
  switch (type) {
    case "primary":
      return <InfoCircle size={16} />;
    case "secondary":
      return <InfoCircle size={16} />;
    case "success":
      return <CheckCircle size={16} />;
    case "warning":
      return <ExclamationCircle size={16} />;
    case "error":
      return <CrossCircle size={16} />;
    case "hint":
      return <LightBulb size={16} />;
    case "security":
      return <Shield color={colors.alertRed} size={32} />;
    case "help":
      return <Shield color={colors.wallet} size={32} />;
    case "twitter":
      return <Twitter color={colors.twitter} size={32} />;
    case "danger":
      return <Shield color={colors.alertRed} size={32} />;
    default:
      return null;
  }
};

type ContainerProps = { small: boolean | undefined; type: AlertType };

const getStyle = (p: ThemedStyledProps<ContainerProps, DefaultTheme>) => {
  switch (p.type) {
    case "primary":
    case "hint":
      return {
        backgroundColor: p.theme.colors.pillActiveBackground,
        // FIXME: use color palette
        textColor: p.theme.colors.palette.primary.main,
        px: 16,
        py: 16,
      };
    case "success":
      return {
        backgroundColor: p.theme.colors.lightGreen,
        textColor: p.theme.colors.positiveGreen,
        px: 16,
        py: 16,
      };
    case "warning":
      return {
        backgroundColor: p.theme.colors.lightWarning,
        textColor: p.theme.colors.orange,
        px: 16,
        py: 16,
      };
    case "error":
      return {
        backgroundColor: p.theme.colors.lightRed,
        textColor: p.theme.colors.alertRed,
        px: 16,
        py: 16,
      };
    case "security":
      return {
        backgroundColor: p.theme.colors.palette.background.default,
        textColor: p.theme.colors.palette.text.shade80,
        borderColor: p.theme.colors.palette.text.shade20,
        px: 24,
        py: 24,
      };
    case "help":
      return {
        backgroundColor: p.theme.colors.palette.background.paper,
        textColor: p.theme.colors.palette.text.shade80,
        borderColor: p.theme.colors.palette.text.shade20,
        px: 24,
        py: 24,
      };
    case "twitter":
      return {
        backgroundColor: p.theme.colors.palette.background.paper,
        textColor: p.theme.colors.palette.text.shade80,
        px: 16,
        py: 16,
      };
    case "danger":
      return {
        backgroundColor: p.theme.colors.palette.background.paper,
        textColor: p.theme.colors.alertRed,
        borderColor: p.theme.colors.palette.text.shade20,
        px: 24,
        py: 24,
      };
    case "secondary":
    default:
      return {
        backgroundColor:
          p.theme.colors.palette.type === "light"
            ? p.theme.colors.palette.text.shade5
            : p.theme.colors.palette.text.shade10,
        textColor: p.theme.colors.palette.text.shade70,
        px: 16,
        py: 16,
      };
  }
};
const LeftContent = styled(Box)``;
const RightContent = styled(Box)``;
const Container = styled(Box).attrs<{ small: boolean | undefined }>(props => ({
  horizontal: true,
  flex: 1,
  fontSize: props.small ? 3 : 4,
}))<ContainerProps>`
  border-radius: 4px;
  align-items: center;

  ${p => {
    const style = getStyle(p);
    return css`
      padding: ${style.py}px ${style.px}px;
      color: ${style.textColor};
      background-color: ${style.backgroundColor};
      border: ${style.borderColor ? "dashed 1px" : "none"};
      border-color: ${style.borderColor || "transparent"};

      > ${LeftContent} {
        margin-right: ${style.px}px;
      }

      > ${RightContent} {
        margin-left: ${style.px}px;
      }
    `;
  }}

  ${p =>
    p.small &&
    css`
      padding: 8px;

      > ${LeftContent} {
        margin-right: 8px;
      }

      > ${RightContent} {
        margin-left: 8px;
      }
    `}
`;
const TitleContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  flex: 1,
  mb: 1,
}))`
  word-break: break-word;
`;
const Content = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  flex: 1,
}))`
  word-break: break-word;
  a {
    cursor: pointer;
    text-decoration: underline;
  }
`;
const CloseContainer = styled(Box)`
  z-index: 1;
  margin-left: 10px;
  cursor: pointer;
  &:hover,
  &:active {
    opacity: 0.8;
  }
`;
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
  | "update"
  | "twitter";

type Props = BoxProps & {
  type?: AlertType;
  children?: React.ReactNode;
  onLearnMore?: () => void;
  learnMoreLabel?: React.ReactNode;
  learnMoreIsInternal?: boolean;
  learnMoreOnRight?: boolean;
  learnMoreUrl?: string | null;
  // if bannerId is provided, the banner is dismissable
  bannerId?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  title?: React.ReactNode;
  horizontal?: boolean;
  noIcon?: boolean;
  small?: boolean;
  style?: React.CSSProperties;
};

export default function Alert({
  children: description,
  onLearnMore,
  learnMoreLabel,
  learnMoreIsInternal = false,
  learnMoreOnRight = false,
  learnMoreUrl,
  bannerId,
  noIcon = false,
  type = "primary",
  rightContent,
  leftContent,
  title,
  small,
  color,
  ...rest
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const dismissedBanners = useSelector(dismissedBannersSelector);
  const label = learnMoreLabel || t("common.learnMore");
  const icon = getIcon(type);
  const isDismissed = bannerId && dismissedBanners.includes(bannerId);
  const hasLearnMore = !!onLearnMore || !!learnMoreUrl;
  const handleLearnMore = useCallback(
    () => (onLearnMore ? onLearnMore() : learnMoreUrl ? openURL(learnMoreUrl) : undefined),
    [onLearnMore, learnMoreUrl],
  );

  const onDismiss = useCallback(() => {
    if (bannerId) dispatch(dismissBanner(bannerId));
  }, [bannerId, dispatch]);
  const learnMore = hasLearnMore && (
    <Text ff="Inter|SemiBold">
      <ExternalLink label={label} isInternal={learnMoreIsInternal} onClick={handleLearnMore} />
    </Text>
  );
  if (isDismissed) return null;
  /**
   * NOTE: Here we used to spread all props, yet there is a mismatch with the `color` prop
   * we receive and the `color` props expected by Container.
   * The `color` prop expected by Container seems to come from the TextColor types, yet the
   * prop `color` we receive seems to work if we pass it to `backgroundColor` instead
   *
   * eg: <Container ... backgroundColor={color} />
   *
   * So ignoring the `color` prop for now
   * Also I'm pretty confident the type now handles the display of the Alert
   *
   */
  return (
    <Container type={type} small={small} {...rest}>
      {leftContent || (!noIcon && icon) ? <LeftContent>{leftContent || icon}</LeftContent> : null}
      <Content>
        {title && <TitleContent>{title}</TitleContent>}
        <div>
          {description}
          {!learnMoreOnRight && hasLearnMore ? <> {learnMore}</> : null}
        </div>
      </Content>
      {bannerId ? (
        <CloseContainer id={`dismiss-${bannerId || ""}-banner`} onClick={onDismiss}>
          <IconCross size={14} />
        </CloseContainer>
      ) : null}
      {!rightContent && learnMoreOnRight && hasLearnMore ? (
        <RightContent>{learnMore}</RightContent>
      ) : null}
      {!!rightContent && <RightContent>{rightContent}</RightContent>}
    </Container>
  );
}
