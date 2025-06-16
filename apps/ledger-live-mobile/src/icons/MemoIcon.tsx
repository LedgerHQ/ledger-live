import React from "react";
import Svg, { Path } from "react-native-svg";

const MemoIcon = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color}>
    <Path
      d="M8.31315 7.75899C8.46506 7.91091 8.46506 8.15721 8.31315 8.30912C8.16124 8.46104 7.91494 8.46104 7.76302 8.30912C7.61111 8.15721 7.61111 7.91091 7.76302 7.75899C7.91494 7.60708 8.16124 7.60708 8.31315 7.75899"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.244 3.02497L10.093 2.99997C10.624 2.99497 11.135 3.20497 11.511 3.57997L20.415 12.488C21.196 13.269 21.196 14.536 20.415 15.317L15.321 20.414C14.54 21.196 13.272 21.196 12.491 20.414L3.58 11.5C3.209 11.129 3 10.625 3 10.099V7.28697C3 6.76097 3.209 6.25697 3.58 5.88597L5.86 3.60497C6.228 3.23697 6.725 3.02897 7.244 3.02497Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default MemoIcon;
