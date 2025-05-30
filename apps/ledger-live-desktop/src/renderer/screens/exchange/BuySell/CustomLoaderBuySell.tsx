import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";

import { Icon, Text } from "@ledgerhq/react-ui/index";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { CustomLoaderType } from "~/renderer/components/WebPTXPlayer";

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
  border-color: ${p => p.theme.colors.palette.opacityDefault.c10};
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

const AnimatedSvg = styled.svg<{ delay: number }>`
  width: 8px;
  height: 8px;
  fill: none;
  animation: ${circleAnimation} 1.5s infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

const Circle = styled.circle`
  fill: ${p => p.theme.colors.palette.neutral.c100};
`;

const EllipsisLoader = () => (
  <Ellipsis>
    <AnimatedSvg viewBox="0 0 8 8" delay={0}>
      <Circle cx="4" cy="4" r="4" />
    </AnimatedSvg>
    <AnimatedSvg viewBox="0 0 8 8" delay={0.1}>
      <Circle cx="4" cy="4" r="4" />
    </AnimatedSvg>
    <AnimatedSvg viewBox="0 0 8 8" delay={0.2}>
      <Circle cx="4" cy="4" r="4" />
    </AnimatedSvg>
  </Ellipsis>
);

/** Custom loader for transition between Buy/Sell and providers */
export const CustomLoaderBuySell: CustomLoaderType = ({ manifest, isLoading }) => {
  const { t } = useTranslation();
  const buySellLoaderFF = useFeature("buySellLoader");
  const durationMs = buySellLoaderFF?.params?.durationMs ?? 0;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const isAppInternal = internalAppIds.includes(manifest.id);
  const isEnabled = buySellLoaderFF?.enabled && !isAppInternal;

  const [extendedInitialLoading, setExtendedInitialLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showProviderLoadingTransition = isEnabled && (isLoading || extendedInitialLoading);

  useEffect(() => {
    if (isEnabled && isLoading && !extendedInitialLoading) {
      setExtendedInitialLoading(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setExtendedInitialLoading(false);
      }, durationMs);
    }
  }, [durationMs, extendedInitialLoading, isAppInternal, isEnabled, isLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!showProviderLoadingTransition) {
    return null;
  }

  if (showProviderLoadingTransition) {
    return (
      <Loader data-testid="custom-buy-sell-loader">
        <VisualWrapper>
          <IconContainer bgColor="black">
            <Icon name="LedgerLogo" size={36} color="palette.constant.white" />
          </IconContainer>
          <EllipsisLoader />
          <IconContainer>
            <ProviderIcon size="XXL" boxed name={manifest.id} />
          </IconContainer>
        </VisualWrapper>
        <Text variant="body" color="palette.opacityDefault.c60" textAlign="center">
          {t("exchange.connectingTo", { provider: manifest.name })}
        </Text>
      </Loader>
    );
  }
};
