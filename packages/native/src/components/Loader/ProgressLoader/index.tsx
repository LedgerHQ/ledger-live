import React from "react";
import { Svg, Circle, G } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";

type Props = {
  // float number between 0 and 1
  progress?: number;

  // function triggered when pressing the loader
  onPress?: () => void;

  // Display an icon in the middle
  Icon?: React.ComponentType<{ color: string; size: number }>;
};

const radius = 25;
const strokeWidth = 2;
const normalizedRadius = radius - strokeWidth / 2;
const circumference = normalizedRadius * 2 * Math.PI;
const iconSize = radius * 0.88;
const iconOffset = radius - iconSize / 2;

const ProgressLoader = ({
  progress = 0,
  onPress,
  Icon,
}: Props): React.ReactElement => {
  const { colors } = useTheme();
  const backgroundColor = colors.primary.c20;
  const progressColor = colors.primary.c90;

  const strokeDashoffset = circumference - progress * circumference;
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.92}
          fill="transparent"
          stroke={backgroundColor}
          strokeDashoffset={0}
          strokeWidth={strokeWidth}
        />
        <G transform={`rotate(-90) translate(-${radius * 2}, 0)`}>
          <Circle
            cx={radius}
            cy={radius}
            r={radius * 0.92}
            fill="transparent"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
        {Icon ? (
          <G transform={`translate(${iconOffset}, ${iconOffset})`}>
            <Icon color={progressColor} size={iconSize} />
          </G>
        ) : null}
      </Svg>
    </TouchableOpacity>
  );
};

export default ProgressLoader;
