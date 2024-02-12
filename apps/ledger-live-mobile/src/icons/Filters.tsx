import React, { FC } from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  size?: number | string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
  dotColor: string;
};

const FiltersIcon: FC<Props> = ({ size = 16, dotColor, color, active, style }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" style={style}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.6673 11.668H13.334C13.794 11.668 14.1673 12.0413 14.1673 12.5013V15.8346C14.1673 16.2946 13.794 16.668 13.334 16.668H11.6673C11.2073 16.668 10.834 16.2946 10.834 15.8346V12.5013C10.834 12.0413 11.2073 11.668 11.6673 11.668Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.4993 14.1667H14.166"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.8333 14.1667H2.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.33398 8.33203H6.66732C6.20732 8.33203 5.83398 7.9587 5.83398 7.4987V4.16536C5.83398 3.70536 6.20732 3.33203 6.66732 3.33203H8.33398C8.79398 3.33203 9.16732 3.70536 9.16732 4.16536V7.4987C9.16732 7.9587 8.79398 8.33203 8.33398 8.33203Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.5 5.83464H5.83333"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {active ? (
      <>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.2317 5.08594H9.16602C8.7518 5.08594 8.41602 5.42172 8.41602 5.83594C8.41602 6.25015 8.7518 6.58594 9.16602 6.58594H11.9458C11.6365 6.13015 11.3938 5.62549 11.2317 5.08594Z"
          fill={color}
        />
        <Circle cx="16.5" cy="3.5" r="3.5" fill={dotColor} />
      </>
    ) : (
      <Path
        d="M9.16602 5.83073H17.4993"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

export default FiltersIcon;
