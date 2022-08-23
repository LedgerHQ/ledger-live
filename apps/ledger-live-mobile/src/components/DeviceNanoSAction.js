// @flow
import { useTheme } from "@react-navigation/native";
import React, { memo } from "react";
import Svg, { Rect, G, Path, Circle } from "react-native-svg";

import {
  Usb,
  Hints,
  ValidationScreen,
  HomeScreen,
  PinScreen,
  ErrorScreen,
} from "./DeviceNanoSComponents";

type Props = {
  wired?: boolean,
  action?: "left" | "accept",
  screen?: "validation" | "home" | "pin" | "empty",
  width: number,
  error?: Error,
};

function DeviceNanoSAction({
  action,
  screen,
  error,
  width = 272,
  wired,
}: Props) {
  const { colors } = useTheme();
  const color = error ? colors.alert : colors.live;
  const isRefusal = error && error.name.startsWith("UserRefused");

  const newWidth = (width * 474) / 274;

  return (
    <Svg width={newWidth} height={(newWidth * 80) / 474} viewBox="0 0 474 80">
      <G fill="none" fillRule="evenodd" transform="translate(100 38)">
        <Rect
          width="271.606"
          height="39.606"
          x="1.197"
          y="1.197"
          fill={color}
          fillOpacity=".12"
          stroke={colors.darkBlue}
          strokeWidth="2.394"
          rx="4"
        />
        <Path
          fill={colors.white}
          stroke={colors.darkBlue}
          strokeWidth="2.394"
          d="M135 1.197c-10.937 0-19.803 8.866-19.803 19.803 0 10.937 8.866 19.803 19.803 19.803h135A2.803 2.803 0 0 0 272.803 38V4A2.803 2.803 0 0 0 270 1.197H135z"
        />
        <Circle
          cx="135"
          cy="21"
          r="10.5"
          stroke={colors.darkBlue}
          strokeLinejoin="square"
        />
        <Circle cx="135" cy="21" r="11.5" stroke={colors.fog} />
        <Rect
          width="65"
          height="23"
          x="24.5"
          y="9.5"
          fill={colors.white}
          fillRule="nonzero"
          stroke={color}
          rx="2"
        />
        <Rect
          width="17"
          height="4"
          x="18"
          y="-2"
          fill={colors.darkBlue}
          fillRule="nonzero"
          rx="1"
        />
        <Rect
          width="17"
          height="4"
          x="80"
          y="-2"
          fill={colors.darkBlue}
          fillRule="nonzero"
          rx="1"
        />

        {/* displays usb cable */}
        {wired ? <Usb /> : null}

        {/* displays action button */}
        {action ? <Hints action={action} color={color} /> : null}

        {/* displays screen type */}
        {screen === "home" ? (
          <HomeScreen color={color} />
        ) : screen === "validation" ? (
          <ValidationScreen />
        ) : screen === "pin" ? (
          <PinScreen color={color} />
        ) : null}

        {/* displays error */}
        {error ? <ErrorScreen rejected={isRefusal} color={color} /> : null}
      </G>
    </Svg>
  );
}

export default memo<Props>(DeviceNanoSAction);
