import React from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";

import { Icon, Text } from "@ledgerhq/react-ui/index";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { useShowProviderLoadingTransition } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { WebviewLoader } from "~/renderer/components/Web3AppWebview/types";

export const Loader = styled.div`
  display: flex;
  gap: 28px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 45px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${p => p.theme.colors.background.default};
  z-index: 2;
`;

const VisualWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const IconContainer = styled.div<{ bgColor?: string }>`
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid;
  border-color: ${p => p.theme.colors.opacityDefault.c10};
  background-color: ${p => p.bgColor};
`;

const circleAnimation = keyframes`
  0%, 60%, 70%, 80%, 90%, 100% {
    opacity: 0.2;
  }
  10%, 50% {
    opacity: 0.4;
  }
  20%, 40% {
    opacity: 0.7;
  }
  30% {
    opacity: 0.9;
  }
`;

const Ellipsis = styled.div`
  display: flex;
  gap: 8px;
`;

const Circle = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.neutral.c100};
  animation: ${circleAnimation} 1.5s infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

const EllipsisLoader = () => (
  <Ellipsis>
    <Circle delay={0} />
    <Circle delay={0.1} />
    <Circle delay={0.2} />
  </Ellipsis>
);

/** Custom loader for transition between LL and providers */
export const ProviderInterstitial: WebviewLoader = ({ manifest, isLoading, description }) => {
  const { t } = useTranslation();
  const showProviderLoadingTransition = useShowProviderLoadingTransition({ manifest, isLoading });

  if (!showProviderLoadingTransition) {
    return null;
  }

  return (
    <Loader data-testid="custom-buy-sell-loader">
      <VisualWrapper>
        <IconContainer bgColor="black">
          <Icon name="LedgerLogo" size={36} color="constant.white" />
        </IconContainer>
        <EllipsisLoader />
        <IconContainer>
          <ProviderIcon size="XXL" boxed name={manifest.id} />
        </IconContainer>
      </VisualWrapper>
      <Text variant="body" color="opacityDefault.c60" textAlign="center">
        {description ?? t("exchange.connectingTo", { provider: manifest.name })}
      </Text>
    </Loader>
  );
};
