import React, { PureComponent } from "react";
import Svg, { Path, G, Rect, Ellipse, Circle } from "react-native-svg";

class PairingFailure extends PureComponent<{}> {
  render() {
    return (
      <Svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={114}
        height={114}
        {...this.props}
      >
        <G fill="none">
          <Path
            fill="#FAE9EA"
            d="M74.733 11.043a22.503 22.503 0 0 0-.94 6.457c0 12.426 10.073 22.5 22.5 22.5 2.43 0 4.769-.385 6.961-1.098a53.315 53.315 0 0 1 4.539 21.598c0 29.547-23.953 53.5-53.5 53.5-29.548 0-53.5-23.953-53.5-53.5S24.745 7 54.293 7a53.34 53.34 0 0 1 20.44 4.043z"
          />
          <G transform="translate(45.793 29)">
            <Rect
              width={10.111}
              height={34.517}
              x={3.444}
              y={0.719}
              stroke="#D22630"
              strokeWidth={2}
              rx={2.16}
            />
            <Path
              fill="#FAE9EA"
              d="M8.5 24.665c4.296 0 7.778 3.764 7.778 8.406v8.036c0 1.99-1.492 3.603-3.333 3.603h-8.89c-1.84 0-3.333-1.613-3.333-3.603v-8.036c0-4.642 3.482-8.406 7.778-8.406z"
            />
            <Path
              stroke="#D22630"
              strokeWidth={2}
              d="M8.5 28.045c2.792 0 5.056 2.254 5.056 5.034v28.764c0 1.191-.97 2.157-2.167 2.157H5.61a2.162 2.162 0 0 1-2.167-2.157V33.079c0-2.78 2.264-5.034 5.056-5.034z"
            />
            <Ellipse
              cx={8.49}
              cy={5.849}
              stroke="#D22630"
              rx={2.321}
              ry={2.254}
            />
            <Ellipse
              cx={8.49}
              cy={33.793}
              stroke="#D22630"
              rx={2.321}
              ry={2.254}
            />
          </G>
          <G transform="translate(78.793)">
            <Circle cx={17.5} cy={17.5} r={17.5} fill="#D22630" />
            <Path
              fill="#FFF"
              transform="rotate(45 18 18)"
              d="M24.625 17.125h-5.75v-5.75A.376.376 0 0 0 18.5 11h-1a.376.376 0 0 0-.375.375v5.75h-5.75A.376.376 0 0 0 11 17.5v1c0 .206.169.375.375.375h5.75v5.75c0 .206.169.375.375.375h1a.376.376 0 0 0 .375-.375v-5.75h5.75A.376.376 0 0 0 25 18.5v-1a.376.376 0 0 0-.375-.375z"
            />
          </G>
        </G>
      </Svg>
    );
  }
}

export default PairingFailure;
