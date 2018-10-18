import React, { PureComponent } from "react";
import Svg, { G, Path, Ellipse } from "react-native-svg";

class PhoneBle extends PureComponent<{}> {
  render() {
    return (
      <Svg width={43} height={74} {...this.props}>
        <G
          fillRule="nonzero"
          transform="translate(1 1)"
          stroke="#142533"
          fill="none"
        >
          <Path
            d="M2.16 0h36.68A2.16 2.16 0 0 1 41 2.16v67.68A2.16 2.16 0 0 1 38.84 72H2.16A2.16 2.16 0 0 1 0 69.84V2.16A2.16 2.16 0 0 1 2.16 0z"
            strokeWidth={2}
          />
          <Path d="M6.356 6.306a1.3 1.3 0 0 0-1.3 1.3v49.82a1.3 1.3 0 0 0 1.3 1.3h28.288a1.3 1.3 0 0 0 1.3-1.3V7.606a1.3 1.3 0 0 0-1.3-1.3H6.356z" />
          <Ellipse cx={20.5} cy={65.032} rx={2.278} ry={2.323} />
          <Path
            strokeWidth={1.6}
            d="M15 36.085l10-8.638L19.634 22v20L25 36.553l-10-8.638"
          />
        </G>
      </Svg>
    );
  }
}

export default PhoneBle;
