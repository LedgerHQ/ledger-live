import React, { useEffect } from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "styled-components/native";

type HeaderProps = {
  title?: string;
  hookOnBack?: () => void;
  hasBackButton?: boolean;
  noCloseButton?: boolean;
  areDrawersLocked?: boolean;
  handleCloseUserEvent?: () => void;
};
const Header = ({
  title,
  hookOnBack,
  hasBackButton,
  noCloseButton,
  areDrawersLocked,
  handleCloseUserEvent,
}: HeaderProps) => {
  const { colors } = useTheme();

  const backButtonOpacity = useSharedValue(hasBackButton ? 1 : 0);
  const backButtonScale = useSharedValue(hasBackButton ? 1 : 0);

  const backButtonAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backButtonOpacity.value,
      transform: [{ scale: backButtonScale.value }],
    }),
    [backButtonOpacity, backButtonScale],
  );

  useEffect(() => {
    if (hasBackButton) {
      backButtonOpacity.value = withTiming(1, { duration: 200 });
      backButtonScale.value = withTiming(1, { duration: 200 });
    } else {
      backButtonOpacity.value = withTiming(0, { duration: 200 });
      backButtonScale.value = withTiming(0, { duration: 200 });
    }
  }, [hasBackButton, backButtonOpacity, backButtonScale]);

  return (
    <Flex flexDirection="row" alignItems="center" justifyContent="space-between" paddingBottom={4}>
      <Flex flexDirection="row" alignItems="center" flex={1}>
        <Animated.View style={backButtonAnimatedStyle}>
          {hookOnBack && (
            <Pressable
              testID="drawer-back-button"
              onPress={hookOnBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
              }}
            >
              <Icons.ArrowLeft size="M" />
            </Pressable>
          )}
        </Animated.View>
        {title && (
          <Text variant="h4" numberOfLines={1} flex={1}>
            {title}
          </Text>
        )}
      </Flex>
      {!noCloseButton && !areDrawersLocked && (
        <Pressable
          onPress={handleCloseUserEvent}
          style={({ pressed }: { pressed: boolean }) => ({
            borderRadius: 999,
            backgroundColor: pressed ? colors.opacityDefault.c10 : colors.opacityDefault.c05,
            padding: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
          })}
        >
          <Icons.Close size="XS" />
        </Pressable>
      )}
    </Flex>
  );
};

export default Header;
