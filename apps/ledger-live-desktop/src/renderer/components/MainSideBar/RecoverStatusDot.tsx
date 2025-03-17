import React, { useCallback, useEffect, useState } from "react";
import { getStoreValue } from "~/renderer/store";
import { LedgerRecoverSubscriptionStateInProgressEnum } from "~/types/recoverSubscriptionState";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Icons } from "@ledgerhq/react-ui";
import useTheme from "~/renderer/hooks/useTheme";
import styled, { keyframes, css } from "styled-components";

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
    top: -5px;
    right: -5px;
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
const StyledIcon = styled(Icons.WarningRoundedFill)<{
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
  const [displayRecoverDot, setDisplayRecoverDot] = useState<boolean>();

  const getRecoverSubscriptionState = useCallback(async () => {
    const storage = await getStoreValue("SUBSCRIPTION_STATE", protectID);
    setDisplayRecoverDot(
      Object.values(LedgerRecoverSubscriptionStateInProgressEnum).includes(
        storage as LedgerRecoverSubscriptionStateInProgressEnum,
      ),
    );
  }, [protectID]);

  useEffect(() => {
    getRecoverSubscriptionState();
  }, [getRecoverSubscriptionState]);

  return displayRecoverDot ? (
    <StyledIcon
      collapsed={collapsed}
      size="XS"
      style={{
        color: colors.palette.warning.c70,
        right: "5px",
        position: "absolute",
      }}
    />
  ) : null;
};

export default RecoverStatusDot;
