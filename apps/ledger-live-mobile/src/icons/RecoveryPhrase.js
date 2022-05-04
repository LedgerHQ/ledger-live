import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

const RecoveryPhrase = props => (
  <Svg width={145} height={109} {...props}>
    <G fill="none" fillRule="evenodd" transform="translate(-1)">
      <Path
        fill="#bdb3ff"
        fillOpacity={0.1}
        stroke="#142533"
        strokeWidth={2}
        d="M29.079 103.688l19.757-83.857-44.68 16.262a2.6 2.6 0 0 0-1.514 3.434l26.437 64.161zm89.316 1.39L97.882 34.45l44.566 16.22a2.6 2.6 0 0 1 1.434 3.61l-25.487 50.798z"
      />
      <Path
        fill="#FFF"
        stroke="#142533"
        strokeWidth={2}
        d="M32.6 1A2.6 2.6 0 0 0 30 3.6v101.8a2.6 2.6 0 0 0 2.6 2.6h82.8a2.6 2.6 0 0 0 2.6-2.6V3.6a2.6 2.6 0 0 0-2.6-2.6H32.6z"
      />
      <Rect width={50} height={2} x={39} y={16} fill="#bdb3ff" rx={1} />
      <Rect width={30} height={2} x={39} y={23} fill="#bdb3ff" rx={1} />
      <Path
        fill="#bdb3ff"
        d="M82.368 91H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 91h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2zm42.368-10H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 81h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2zm42.368-10H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 71h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2zm42.368-10H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 61h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2zm42.368-10H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 51h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2zm42.368-10H108a1 1 0 1 1 0 2H82.368a1 1 0 1 1 0-2zM40 41h25.632a1 1 0 1 1 0 2H40a1 1 0 0 1 0-2z"
        opacity={0.4}
      />
    </G>
  </Svg>
);

export default RecoveryPhrase;
