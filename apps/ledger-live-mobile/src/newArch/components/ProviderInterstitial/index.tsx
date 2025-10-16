import React, { useEffect, useRef } from "react";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import { Svg, Circle as SVGCircle, SvgUri } from "react-native-svg";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";

import { Icon, Text, Flex } from "@ledgerhq/native-ui";
import { useShowProviderLoadingTransition } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { InterstitialType } from "~/components/WebPTXPlayer";
import { DdRum, RumActionType } from "@datadog/mobile-react-native";

export const Loader = styled(Flex)`
  gap: 28px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${p => p.theme.colors.background.default};
  z-index: 2;
`;

const VisualWrapper = styled(Flex)`
  flex-direction: row;
  align-items: center;
  gap: 24px;
`;

const IconContainer = styled(Flex)<{ bgColor?: string }>`
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  border: 1px solid;
  overflow: hidden;
  border-color: ${p => p.theme.colors.opacityDefault.c10};
  background-color: ${p => p.bgColor};
`;

const Ellipsis = styled(Flex)`
  flex-direction: row;
  gap: 8px;
`;

const Circle = styled(SVGCircle)`
  fill: ${p => p.theme.colors.neutral.c100};
`;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const AnimatedCircle = ({ delay }: { delay: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1500 }), -1, false));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      [0.2, 0.4, 0.7, 0.9, 0.7, 0.4, 0.2, 0.2, 0.2, 0.2, 0.2],
    );
    return {
      opacity,
    };
  }, [progress]);

  return (
    <AnimatedSvg width={8} height={8} viewBox="0 0 8 8" style={animatedStyle}>
      <Circle cx={4} cy={4} r={4} />
    </AnimatedSvg>
  );
};

/** Custom loader for transition between Buy/Sell and providers */
export const ProviderInterstitial: InterstitialType = ({ manifest, isLoading, description }) => {
  const { t } = useTranslation();
  const showProviderLoadingTransition = useShowProviderLoadingTransition({ manifest, isLoading });

  useProviderConnectRum({
    isLoading: Boolean(showProviderLoadingTransition),
    providerId: manifest.id,
    providerName: manifest.name,
  });

  if (!showProviderLoadingTransition) {
    return null;
  }

  return (
    <Loader testID="custom-buy-sell-loader" style={{ elevation: 2 }}>
      <VisualWrapper>
        <IconContainer bgColor="black">
          <Icon name="LedgerLogo" size={36} color="constant.white" />
        </IconContainer>
        <Ellipsis>
          <AnimatedCircle delay={0} />
          <AnimatedCircle delay={100} />
          <AnimatedCircle delay={200} />
        </Ellipsis>
        <IconContainer>
          <SvgUri
            width={60}
            height={60}
            uri={getProviderIconUrl({ name: manifest.id, boxed: true })}
          />
        </IconContainer>
      </VisualWrapper>
      <Text variant="body" color="opacityDefault.c60" textAlign="center" style={{ padding: 16 }}>
        {description ?? t("transfer.exchange.connectingTo", { provider: manifest.name })}
      </Text>
    </Loader>
  );
};

/**
 * Tracks provider connect loader metrics in Datadog RUM.
 * - Sends "start" and "complete" actions (linked by loadId)
 * - Adds a custom timing when completed
 * - Logs "timeout" actions if the loader never finishes
 */
function useProviderConnectRum({
  isLoading,
  providerId,
  providerName,
  timeoutMs = 20000,
}: {
  isLoading: boolean;
  providerId: string;
  providerName: string;
  timeoutMs?: number;
}) {
  const loadIdRef = useRef<string | null>(null);
  const startRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading && loadIdRef.current === null) {
      // loader starts
      loadIdRef.current = uniqueId();
      startRef.current = Date.now();

      DdRum.addAction(RumActionType.CUSTOM, "provider_connect_start", {
        providerId,
        providerName,
        loadId: loadIdRef.current,
      });

      // detect stuck loaders
      timeoutRef.current = setTimeout(() => {
        if (loadIdRef.current) {
          const elapsed = Date.now() - (startRef.current ?? Date.now());
          DdRum.addAction(RumActionType.CUSTOM, "provider_connect_timeout", {
            providerId,
            providerName,
            loadId: loadIdRef.current,
            elapsedMs: elapsed,
            status: "stuck",
          });
        }
      }, timeoutMs);
    }

    if (!isLoading && loadIdRef.current !== null) {
      const duration = Date.now() - (startRef.current ?? Date.now());

      DdRum.addAction(RumActionType.CUSTOM, "provider_connect_complete", {
        providerId,
        providerName,
        loadId: loadIdRef.current,
        durationMs: duration,
        status: "completed",
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      loadIdRef.current = null;
      startRef.current = null;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, providerId, providerName, timeoutMs]);
}

function uniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return timestamp + randomString;
}
