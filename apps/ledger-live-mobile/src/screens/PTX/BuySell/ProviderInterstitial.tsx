import React, { useEffect } from "react";
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
  });

  return (
    <AnimatedSvg width={8} height={8} viewBox="0 0 8 8" style={animatedStyle}>
      <Circle cx={4} cy={4} r={4} />
    </AnimatedSvg>
  );
};

/** Custom loader for transition between Buy/Sell and providers */
export const ProviderInterstitial: InterstitialType = ({ manifest, isLoading }) => {
  const { t } = useTranslation();
  const showProviderLoadingTransition = useShowProviderLoadingTransition({ manifest, isLoading });

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
      <Text variant="body" color="opacityDefault.c60" textAlign="center">
        {t("transfer.exchange.connectingTo", { provider: manifest.name })}
      </Text>
    </Loader>
  );
};
