import Clipboard from "@react-native-clipboard/clipboard";
import React, { memo, useCallback, useMemo } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import styled from "styled-components/native";
import { Button, Icons } from "@ledgerhq/native-ui";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";

export default memo(CopyButton);

type Props = Omit<ButtonProps, "Icon" | "isNewIcon" | "onPress"> & {
  text: string;
  transitionDuration?: number;
};

function CopyButton({ text, ...props }: Props) {
  const transition = useSharedValue(0);
  const handleCopy = useCallback(() => {
    Clipboard.setString(text);

    transition.value = withTiming(1, { duration: 200 });
    setTimeout(() => (transition.value = withTiming(0, { duration: 200 })), 1200);
  }, [text, transition]);

  const copyIconAnimation = useAnimatedStyle(() => ({
    opacity: 1 - transition.value,
  }));

  const checkIconAnimation = useAnimatedStyle(() => ({
    opacity: transition.value,
  }));

  const icon = useMemo(
    () => (
      <IconContainer>
        <Animated.View style={copyIconAnimation}>
          <Icons.Copy />
        </Animated.View>
        <Animated.View style={[checkIconAnimation, checkIconStyle]}>
          <Icons.Check />
        </Animated.View>
      </IconContainer>
    ),
    [copyIconAnimation, checkIconAnimation],
  );

  return <Button {...props} Icon={icon} isNewIcon onPress={handleCopy} />;
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
