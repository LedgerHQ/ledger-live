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
    <Flex>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingBottom={4}
      >
        <Flex width={32} height={32} alignItems="center" justifyContent="center">
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
                  width: 32,
                  height: 32,
                }}
              >
                <Icons.ArrowLeft size="M" />
              </Pressable>
            )}
          </Animated.View>
        </Flex>

        <Flex width={32} height={32} alignItems="center" justifyContent="center">
          {!noCloseButton && !areDrawersLocked && (
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={handleCloseUserEvent}
              testID="drawer-close-button"
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
      </Flex>

      {title && (
        <Flex alignItems="center" pb={32}>
          <Text variant="h4" numberOfLines={2} textAlign="center">
            {title}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Header;
