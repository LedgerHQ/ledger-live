import React from "react";
import { LedgerRecoverSubscriptionStateInProgressEnum } from "~/types/recoverSubscriptionState";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Icons } from "@ledgerhq/react-ui";
import useTheme from "~/renderer/hooks/useTheme";
import styled, { keyframes, css } from "styled-components";
import { useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";

interface RecoverStatusNotificationProps {
  collapsed: boolean;
}
const collapseAnim = keyframes`
  0% {
    opacity: 0;
    top: -5px;
    right: -5px;
    transform: translateY(0);
  }
  100% {
    opacity: 1;
    top: 5px;
    right: 5px;
    transform: translateY(0);
  }
`;
const openAnim = keyframes`
  0% {
    opacity: 0;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
  }
  100% {
    opacity: 1;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
  }
`;
const StyledBox = styled(Box)<{
  opacity?: number;
  collapsed?: boolean | null;
}>`
  opacity: ${p => p.opacity};
  position: absolute;
  top: -5px;
  right: -5px;
  transform: translateY(0);
  opacity: 0;
  animation: ${p =>
      p.collapsed
        ? css`
            ${collapseAnim}
          `
        : css`
            ${openAnim}
          `}
    200ms 500ms ease forwards;
`;

const RecoverStatusDot = ({ collapsed }: RecoverStatusNotificationProps) => {
  const { colors } = useTheme();
  const recoverServices = useFeature("protectServicesDesktop");
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";
  const {
    data: { subscriptionState },
  } = useRecoverBannerState(protectID);
  const displayRecoverDot = subscriptionState in LedgerRecoverSubscriptionStateInProgressEnum;

  return displayRecoverDot ? (
    <StyledBox collapsed={collapsed}>
      <Icons.WarningRoundedFill
        size="XS"
        style={{
          color: colors.warning.c70,
          right: "-3px",
          top: "-8px",
          position: "absolute",
        }}
      />
    </StyledBox>
  ) : null;
};

export default RecoverStatusDot;
