import { useTheme } from "@react-navigation/native";
import React from "react";
import Svg, { Rect } from "react-native-svg";

type Props = {
  size: number;
  color?: string;
};
export default function NanoDeviceCheckIcon({ size = 16, color: c }: Props) {
  const { colors } = useTheme();
  const color = c || colors.live;
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Rect width="12" height="12" rx="1" fill={color} fillOpacity="0.2" />
      <Rect transform={[{ translateX: 9 }, { translateY: 3 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 8 }, { translateY: 4 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 7 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 6 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 5 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 4 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 3 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 8 }, { translateY: 3 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 7 }, { translateY: 4 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 6 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 5 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 4 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 3 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 2 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 8 }, { translateY: 4 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 7 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 6 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 5 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 4 }, { translateY: 8 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 3 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 2 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 9 }, { translateY: 4 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 8 }, { translateY: 5 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 7 }, { translateY: 6 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 6 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 5 }, { translateY: 8 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 4 }, { translateY: 7 }]} width="1" height="1" fill={color} />
      <Rect transform={[{ translateX: 3 }, { translateY: 6 }]} width="1" height="1" fill={color} />
    </Svg>
  );
}
