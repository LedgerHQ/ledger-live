import React, { useState } from "react";
import { Pressable, LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import styled from "styled-components/native";
import Flex from "../../Layout/Flex";
import Text from "../../Text";
import Box from "../../Layout/Box";

const Container = styled(Flex)`
  height: 100%;
  justify-content: space-between;
  flex-direction: row;
  position: relative;
`;

const AnimatedBackground = styled(Animated.View)`
  position: absolute;
  height: 100%;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.opacityDefault.c05};
`;

const Tab = styled(Flex)`
  flex: 1;
  padding: 4px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

type TabSelectorProps = {
  labels: string[];
  onToggle: (value: string) => void;
};

export default function TabSelector({ labels, onToggle }: TabSelectorProps): JSX.Element {
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const handlePress = (value: string, index: number) => {
    onToggle(value);
    translateX.value = (containerWidth / labels.length) * index;
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(translateX.value, { duration: 250 }) }],
      width: containerWidth / labels.length,
    };
  });

  return (
    <Box
      height="100%"
      width="100%"
      borderRadius={12}
      border={1}
      borderColor="opacityDefault.c10"
      p={2}
    >
      <Container onLayout={handleLayout}>
        <AnimatedBackground style={animatedStyle} />
        {labels.map((label, index) => (
          <Pressable
            hitSlop={16}
            key={label}
            onPress={() => handlePress(label, index)}
            style={({ pressed }: { pressed: boolean }) => [
              { opacity: pressed ? 0.5 : 1.0, flex: 1 },
            ]}
          >
            <Tab>
              <Text fontSize={14} fontWeight="semiBold" flexShrink={1} numberOfLines={1}>
                {label}
              </Text>
            </Tab>
          </Pressable>
        ))}
      </Container>
    </Box>
  );
}
