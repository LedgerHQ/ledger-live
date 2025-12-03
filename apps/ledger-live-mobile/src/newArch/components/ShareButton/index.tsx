import React, { memo, useCallback, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import styled from "styled-components/native";
import { Button, Icons } from "@ledgerhq/native-ui";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button/index";
import { Platform, Share } from "react-native";

export default memo(ShareButton);

type Props = Omit<ButtonProps, "Icon" | "isNewIcon" | "onPress"> & {
  value: string;
  transitionDuration?: number;
};

function ShareButton({ value, ...props }: Props) {
  const transition = useSharedValue(0);
  const handleShare = useCallback(async () => {
    await Share.share({
      message: value,
    });

    transition.value = withTiming(1, { duration: 200 });
    setTimeout(() => (transition.value = withTiming(0, { duration: 200 })), 1200);
  }, [value, transition]);

  const shareIconAnimation = useAnimatedStyle(
    () => ({
      opacity: 1 - transition.value,
    }),
    [transition],
  );

  const checkIconAnimation = useAnimatedStyle(
    () => ({
      opacity: transition.value,
    }),
    [transition],
  );

  const icon = useMemo(() => {
    const ShareIcon = Platform.OS === "android" ? <Icons.ShareAlt /> : <Icons.Share />;
    return (
      <IconContainer>
        <Animated.View style={shareIconAnimation}>{ShareIcon}</Animated.View>
        <Animated.View style={[checkIconAnimation, checkIconStyle]}>
          <Icons.Check />
        </Animated.View>
      </IconContainer>
    );
  }, [shareIconAnimation, checkIconAnimation]);

  return <Button {...props} Icon={icon} isNewIcon onPress={handleShare} />;
}

const IconContainer = styled.View`
  position: relative;
`;
const checkIconStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
} as const;
