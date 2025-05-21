import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import { Svg, Circle as SVGCircle, SvgUri } from "react-native-svg";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";

import { Icon, Text, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { CustomLoaderType } from "~/components/WebPTXPlayer";

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

const CreateCircleStyle = (progress: SharedValue<number>, outputRange: number[]) => {
  return useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      outputRange,
    );

    return { opacity };
  });
};

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const EllipsisLoader = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, [progress]);

  const circle1Style = CreateCircleStyle(progress, [0.2, 0.4, 0.4, 0.4, 0.6, 0.6, 0.2, 0.2, 0.2]);
  const circle2Style = CreateCircleStyle(progress, [0.2, 0.2, 0.6, 0.6, 0.6, 0.6, 0.4, 0.2, 0.2]);
  const circle3Style = CreateCircleStyle(progress, [0.2, 0.2, 0.2, 0.6, 0.6, 0.6, 0.6, 0.4, 0.2]);

  return (
    <Ellipsis>
      <AnimatedSvg width={8} height={8} viewBox="0 0 8 8" style={circle1Style}>
        <Circle cx={4} cy={4} r={4} />
      </AnimatedSvg>
      <AnimatedSvg width={8} height={8} viewBox="0 0 8 8" style={circle2Style}>
        <Circle cx={4} cy={4} r={4} />
      </AnimatedSvg>
      <AnimatedSvg width={8} height={8} viewBox="0 0 8 8" style={circle3Style}>
        <Circle cx={4} cy={4} r={4} />
      </AnimatedSvg>
    </Ellipsis>
  );
};

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
      <Loader style={{ elevation: 2 }}>
        <VisualWrapper>
          <IconContainer bgColor="black">
            <Icon name="LedgerLogo" size={36} color="constant.white" />
          </IconContainer>
          <EllipsisLoader />
          <IconContainer>
            <SvgUri
              width={60}
              height={60}
              uri={getProviderIconUrl({ name: manifest.id, boxed: true })}
            />
          </IconContainer>
        </VisualWrapper>
        <Text variant="body" color="opacityDefault.c60" textAlign="center">
          {t("transfer.exchange.connectingTo", { provider: manifest.name })}
        </Text>
      </Loader>
    );
  }
};
