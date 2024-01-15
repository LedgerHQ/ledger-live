import React, { useMemo } from "react";
import styled from "styled-components/native";
import Animated, {
  useDerivedValue,
  useAnimatedStyle,
  Easing,
  withTiming,
} from "react-native-reanimated";

type Props = {
  slidesLength: number;
  activeIndex: number;
  onChange?: (index: number) => void;
};

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 6px;
  position: relative;
`;

const bulletStyle = `
  width: 6px;
  height: 6px;
  border-radius: 6px;
  margin: 0 6px;
`;

const Bullet = styled.TouchableOpacity`
  ${bulletStyle}
  background-color: ${(p) => p.theme.colors.neutral.c40};
`;

const ActiveBullet = styled.View.attrs({ pointerEvents: "none" })`
  ${bulletStyle}
  background-color: ${(p) => p.theme.colors.neutral.c100};
  position: absolute;
  top: 0;
  left: 0;
`;

const AnimatedBullet = Animated.createAnimatedComponent(ActiveBullet);

const config = {
  duration: 200,

  easing: Easing.bezier(0.5, 0.01, 0, 1),
};

function SlideIndicator({ slidesLength, activeIndex = 0, onChange }: Props): React.ReactElement {
  const slidesArray = useMemo(() => new Array(slidesLength).fill(0), [slidesLength]);

  const activeSize = useDerivedValue(() => {
    const size = (Math.max(0, Math.min(slidesLength - 1, activeIndex)) + 1) * (6 + 12) - 12;
    return size;
  }, [activeIndex, slidesLength]);

  const animatedStyles = useAnimatedStyle(() => ({
    width: withTiming(activeSize.value, config),
  }));

  return (
    <Container>
      {slidesArray.map((_, index) => (
        <Bullet
          key={index}
          onPress={() => onChange && onChange(index)}
          testID={`slide-bullet-${index}`}
        />
      ))}
      <AnimatedBullet style={[animatedStyles]} />
    </Container>
  );
}

export default SlideIndicator;
