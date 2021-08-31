import React, { useMemo } from "react";
import styled from "styled-components/native";
import Animated, {
  useAnimatedStyle,
  Easing,
  withTiming,
} from "react-native-reanimated";

type Props = {
  slidesLength: number;
  activeIndex: number;
  onChange: (index: number) => void;
};

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 6px;
  position: relative;
`;

const Bullet = styled.TouchableOpacity`
  width: 6px;
  height: 6px;
  border-radius: 6px;
  margin: 0 6px;
  background-color: ${(p) => p.theme.colors.palette.grey.border};
`;

const ActiveBullet = styled(Bullet)`
  background-color: ${(p) => p.theme.colors.palette.text.default};
  position: absolute;
  top: 0;
  left: 0;
`;

const AnimatedBullet = Animated.createAnimatedComponent(ActiveBullet);

const config = {
  duration: 200,
  easing: Easing.bezier(0.5, 0.01, 0, 1),
};

function SlideIndicator({
  slidesLength,
  activeIndex = 0,
  onChange,
}: Props): React.ReactElement {
  const slidesArray = useMemo(
    () => new Array(slidesLength).fill(0),
    [slidesLength],
  );

  const activeSize = useMemo(
    () =>
      (Math.max(0, Math.min(slidesLength - 1, activeIndex)) + 1) * (6 + 12) -
      12,
    [activeIndex, slidesLength],
  );

  const animatedStyles = useAnimatedStyle(() => ({
    width: withTiming(activeSize, config),
  }));

  return (
    <Container>
      {slidesArray.map((_, index) => (
        <Bullet key={index} onPress={() => onChange(index)} />
      ))}
      <AnimatedBullet style={[animatedStyles]} />
    </Container>
  );
}

export default SlideIndicator;
