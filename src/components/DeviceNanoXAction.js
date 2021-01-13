// @flow
import { useTheme } from "@react-navigation/native";
import React, { memo } from "react";
import Svg, { Rect, G, Path, Circle } from "react-native-svg";

import {
  Hints,
  Usb,
  ValidationScreen,
  EmptyScreen,
  PinScreen,
  HomeScreen,
  ErrorScreen,
} from "./DeviceNanoXComponents";

type Props = {
  wired?: boolean,
  action?: "left" | "accept",
  screen?: "validation" | "home" | "pin" | "empty",
  width: number,
  error?: Error,
};

function DeviceNanoXAction({
  action,
  screen,
  error,
  width = 272,
  wired,
}: Props) {
  const { colors } = useTheme();
  const color = error ? colors.alert : colors.live;
  const isRefusal = error && error.name.startsWith("UserRefused");

  const newWidth = (width * 486) / 286;

  return (
    <Svg width={newWidth} height={(newWidth * 87) / 486} viewBox="0 0 486 87">
      <G fill="none" fillRule="evenodd">
        <G transform="translate(100 45)">
          <Rect
            width="271.606"
            height="39.606"
            x="1.197"
            y="1.197"
            fill={color}
            fillOpacity=".12"
            stroke={colors.darkBlue}
            strokeWidth="2.394"
            rx="6.227"
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
          <G>
            <Circle
              cx="25"
              cy="21"
              r="10.5"
              stroke={colors.darkBlue}
              strokeLinejoin="square"
            />
            <Circle
              cx="25"
              cy="21"
              r="11.5"
              stroke={color}
              strokeOpacity=".2"
            />
          </G>
        </G>
        {/* displays usb cable */}
        {wired ? <Usb /> : null}

        {/* displays action button */}
        {action ? <Hints action={action} color={color} /> : null}

        {/* displays screen type */}
        {screen === "empty" ? (
          <EmptyScreen color={color} />
        ) : screen === "home" ? (
          <HomeScreen color={color} />
        ) : screen === "pin" ? (
          <PinScreen color={color} />
        ) : screen === "validation" ? (
          <ValidationScreen color={color} />
        ) : null}

        {/* displays error */}
        {error ? <ErrorScreen rejected={isRefusal} color={color} /> : null}
      </G>
    </Svg>
  );
}

export default memo<Props>(DeviceNanoXAction);
