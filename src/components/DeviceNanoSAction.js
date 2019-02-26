// @flow
import React, { PureComponent } from "react";
import Svg, { Rect, G, Path, Circle } from "react-native-svg";

import {
  Hints,
  Usb,
  ValidationScreen,
  EmptyScreen,
  PinScreen,
  HomeScreen,
  ErrorScreen,
} from "./DeviceNanoSComponents";

class DeviceNanoSAction extends PureComponent<{
  connected?: boolean,
  action?: "left" | "both" | "right",
  screen?: "validation" | "home" | "pin" | "empty",
  width: number,
  error?: Error,
}> {
  static defaultProps = {
    width: 300,
  };

  render() {
    const { action, screen, error, width, connected } = this.props;

    const color = error ? "#EA2E49" : "#6490F1";
    const isRefusal = error && error.name.startsWith("UserRefused");

    let usbNewSize = 100;

    if (connected) {
      const widthPercent = width / 286;
      usbNewSize = 100 * widthPercent;
    }

    return (
      <Svg
        width={width}
        height={(width * 87) / 386}
        viewBox={`0 0 ${connected ? 386 : 286} 87`}
        marginRight={connected ? `${(100 / 386) * 100}%` : "0%"}
      >
        <G fill="none" fillRule="evenodd">
          <G transform={`translate(${connected ? 100 : 0} 45)`}>
            <Rect
              width="271.606"
              height="39.606"
              x="1.197"
              y="1.197"
              fill={color}
              fillOpacity=".12"
              stroke="#142533"
              strokeWidth="2.394"
              rx="6.227"
            />
            <Path
              fill="#FFF"
              stroke="#142533"
              strokeWidth="2.394"
              d="M135 1.197c-10.937 0-19.803 8.866-19.803 19.803 0 10.937 8.866 19.803 19.803 19.803h135A2.803 2.803 0 0 0 272.803 38V4A2.803 2.803 0 0 0 270 1.197H135z"
            />
            <Circle
              cx="135"
              cy="21"
              r="10.5"
              stroke="#142533"
              strokeLinejoin="square"
            />
            <Circle cx="135" cy="21" r="11.5" stroke="#D8D8D8" />
            <G>
              <Circle
                cx="25"
                cy="21"
                r="10.5"
                stroke="#142533"
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
          {connected ? <Usb /> : null}

          {/* displays action button */}
          {action ? (
            <Hints action={action} color={color} connected={connected} />
          ) : null}

          {/* displays screen type */}
          {screen === "empty" ? (
            <EmptyScreen color={color} connected={connected} />
          ) : screen === "home" ? (
            <HomeScreen color={color} connected={connected} />
          ) : screen === "pin" ? (
            <PinScreen color={color} connected={connected} />
          ) : screen === "validation" ? (
            <ValidationScreen color={color} connected={connected} />
          ) : null}

          {/* displays error */}
          {error ? (
            <ErrorScreen
              rejected={isRefusal}
              color={color}
              connected={connected}
            />
          ) : null}
        </G>
      </Svg>
    );
  }
}

export default DeviceNanoSAction;
