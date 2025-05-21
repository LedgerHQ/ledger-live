import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { Keyframes, keyframes } from "styled-components";

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

const circle1Animation = keyframes`
  0%, 75%, 87.5%, 100% {
    opacity: 0.2;
  }
  12.5%, 25%, 37.5% {
    opacity: 0.4;
  }
  50%, 62.5% {
    opacity: 0.6;
  }
`;

const circle2Animation = keyframes`
  0%, 12.5%, 87.5%, 100% {
    opacity: 0.2;
  }
  25%, 37.5%, 50%, 62.5% {
    opacity: 0.6;
  }
  75% {
    opacity: 0.4;
  }
`;

const circle3Animation = keyframes`
  0%, 12.5%, 25%, 100% {
    opacity: 0.2;
  }
  37.5%, 50%, 62.5%, 75% {
    opacity: 0.6;
  }
  87.5% {
    opacity: 0.4;
  }
`;

const Ellipsis = styled.div`
  display: flex;
  gap: 8px;
`;

const AnimatedSvg = styled.svg<{ animation: Keyframes }>`
  width: 8px;
  height: 8px;
  fill: none;
  animation: ${({ animation }) => animation} 1.3s infinite;
`;

const Circle = styled.circle`
  fill: ${p => p.theme.colors.palette.neutral.c100};
`;

const EllipsisLoader = () => (
  <Ellipsis>
    <AnimatedSvg viewBox="0 0 8 8" animation={circle1Animation}>
      <Circle cx="4" cy="4" r="4" />
    </AnimatedSvg>
    <AnimatedSvg viewBox="0 0 8 8" animation={circle2Animation}>
      <Circle cx="4" cy="4" r="4" />
    </AnimatedSvg>
    <AnimatedSvg viewBox="0 0 8 8" animation={circle3Animation}>
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
      <Loader>
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
