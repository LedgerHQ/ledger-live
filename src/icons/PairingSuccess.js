// @flow
import React, { PureComponent } from "react";
import Svg, { Defs, Path, G, Rect, Ellipse, Circle } from "react-native-svg";

class PairingSuccess extends PureComponent<{}> {
  render() {
    return (
      <Svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={114}
        height={114}
        {...this.props}
      >
        <Defs>
          <Path
            id="a"
            d="M101.765 12.11l-8.22 8.22-3.021-3.02a.375.375 0 0 0-.53 0l-.884.883a.375.375 0 0 0 0 .53l4.17 4.17a.375.375 0 0 0 .53 0l9.369-9.369a.375.375 0 0 0 0-.53l-.884-.884a.375.375 0 0 0-.53 0z"
          />
        </Defs>
        <G fill="none" transform="translate(.793)">
          <Path
            fill="#EFF3FD"
            d="M73.94 11.043A22.503 22.503 0 0 0 73 17.5C73 29.926 83.074 40 95.5 40c2.43 0 4.77-.385 6.962-1.098A53.315 53.315 0 0 1 107 60.5c0 29.547-23.953 53.5-53.5 53.5S0 90.047 0 60.5 23.953 7 53.5 7a53.34 53.34 0 0 1 20.44 4.043z"
          />
          <Path
            stroke="#6490F1"
            strokeLinecap="round"
            strokeWidth={1.5}
            d="M68.266 70.667A13.558 13.558 0 0 0 72.3 61c0-3.74-1.509-7.126-3.951-9.584"
            opacity={0.2}
          />
          <Path
            stroke="#6490F1"
            strokeLinecap="round"
            strokeWidth={2}
            d="M70.402 78.198C75.894 74.454 79.5 68.148 79.5 61c0-6.95-3.41-13.105-8.647-16.882"
            opacity={0.2}
          />
          <Path
            stroke="#6490F1"
            strokeLinecap="round"
            strokeWidth={2}
            d="M72.519 85.358C80.988 80.543 86.7 71.438 86.7 61c0-10.274-5.534-19.256-13.783-24.127M36.734 70.667A13.558 13.558 0 0 1 32.7 61c0-3.74 1.509-7.126 3.951-9.584"
            opacity={0.2}
          />
          <Path
            stroke="#6490F1"
            strokeLinecap="round"
            strokeWidth={2}
            d="M34.598 78.198C29.106 74.454 25.5 68.148 25.5 61c0-6.95 3.41-13.105 8.647-16.882"
            opacity={0.2}
          />
          <Path
            stroke="#6490F1"
            strokeLinecap="round"
            strokeWidth={2}
            d="M32.481 85.358C24.012 80.543 18.3 71.438 18.3 61c0-10.274 5.534-19.256 13.783-24.127"
            opacity={0.2}
          />
          <G transform="translate(44 29)">
            <Rect
              width={10.111}
              height={34.517}
              x={3.444}
              y={0.719}
              stroke="#6490F1"
              strokeWidth={2}
              rx={2.16}
            />
            <Path
              fill="#EFF3FD"
              d="M8.5 24.665c4.296 0 7.778 3.764 7.778 8.406v8.036c0 1.99-1.492 3.603-3.333 3.603h-8.89c-1.84 0-3.333-1.613-3.333-3.603v-8.036c0-4.642 3.482-8.406 7.778-8.406z"
            />
            <Path
              stroke="#6490F1"
              strokeWidth={2}
              d="M8.5 28.045c2.792 0 5.056 2.254 5.056 5.034v28.764c0 1.191-.97 2.157-2.167 2.157H5.61a2.162 2.162 0 0 1-2.167-2.157V33.079c0-2.78 2.264-5.034 5.056-5.034z"
            />
            <Ellipse
              cx={8.49}
              cy={5.849}
              stroke="#6490F1"
              rx={2.321}
              ry={2.254}
            />
            <Ellipse
              cx={8.49}
              cy={33.793}
              stroke="#6490F1"
              rx={2.321}
              ry={2.254}
            />
          </G>
          <Circle cx={95.5} cy={17.5} r={17.5} fill="#72B74A" />
          <Path
            fill="#fff"
            d="M101.765 12.11l-8.22 8.22-3.021-3.02a.375.375 0 0 0-.53 0l-.884.883a.375.375 0 0 0 0 .53l4.17 4.17a.375.375 0 0 0 .53 0l9.369-9.369a.375.375 0 0 0 0-.53l-.884-.884a.375.375 0 0 0-.53 0z"
          />
        </G>
      </Svg>
    );
  }
}

export default PairingSuccess;
