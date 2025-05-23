import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { LinearGradient, Stop, Mask, Path, Rect, G, Defs } from "react-native-svg";
import styled from "styled-components/native";
import { system, size, SizeProps } from "styled-system";

const strokeSystem = system({
  stroke: {
    property: "stroke",
    scale: "colors",
  },
});

export type Props = React.ComponentProps<typeof Loader> & {
  color?: string;
};

export default function InfiniteLoader({
  size = 38,
  color = "primary.c50",
  mock = false,
  testID = "",
  ...extraProps
}: Props): JSX.Element {
  const rotation = useRef(new Animated.Value(0)).current;

  const animate = () => {
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      animate();
    });
  };

  useEffect(() => {
    if (mock) return;
    animate();
    return () => {
      rotation.stopAnimation();
    };
  }, [rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: [{ rotateZ: rotateInterpolate }],
      }}
      testID={testID}
    >
      <Loader
        size={size}
        stroke={color}
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...extraProps}
      >
        <Defs>
          <LinearGradient
            id="gradient-start"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-20)"
          >
            <Stop offset={0} stopColor="white" stopOpacity={0.5} />
            <Stop offset={1} stopColor="white" stopOpacity={1} />
          </LinearGradient>
          <LinearGradient
            id="gradient-end"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-20)"
          >
            <Stop offset={0} stopColor="white" stopOpacity={0.5} />
            <Stop offset={1} stopColor="white" stopOpacity={0} />
          </LinearGradient>
          <Mask id="gradient-mask" x="0" y="0" width="44" height="44" maskUnits="userSpaceOnUse">
            <Rect
              x={0}
              y={-4}
              width={44}
              height={22}
              strokeWidth={0}
              fill="url(#gradient-start)"
              transform="rotate(10)"
            />
            <Rect
              x={0}
              y={18}
              width={44}
              height={21}
              strokeWidth={0}
              fill="url(#gradient-end)"
              transform="rotate(10)"
            />
          </Mask>
        </Defs>
        <G mask="url(#gradient-mask)">
          <StyledPath
            d="M34.8807 20.9499C35.3608 17.0398 34.3815 13.09 32.1304 9.85712C29.8793 6.6242 26.5146 4.33541 22.6808 3.42914C18.847 2.52287 14.8136 3.06283 11.3532 4.94559C7.89277 6.82836 5.24858 9.92158 3.92708 13.6328C2.60558 17.344 2.69968 21.4123 4.19135 25.0584C5.68302 28.7045 8.4674 31.6722 12.0112 33.3929C15.5549 35.1137 19.609 35.4666 23.3968 34.384C27.1846 33.3015 30.4398 30.8596 32.5391 27.526"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={color}
            fill="none"
          />
        </G>
      </Loader>
    </Animated.View>
  );
}

const Loader = styled(Svg).attrs<SizeProps>((props) => ({
  ...strokeSystem(props),
  width: props.size,
  height: props.size,
}))<SizeProps>`
  ${size}
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`;

const StyledPath = styled(Path).attrs((props) => ({
  ...strokeSystem(props),
}))``;
