// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size?: number,
  color?: string,
};

export default function CloseCircle({ size = 14, color }: Props) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.6 7C12.6 10.0928 10.0928 12.6 7 12.6C3.90721 12.6 1.4 10.0928 1.4 7C1.4 3.90721 3.90721 1.4 7 1.4C10.0928 1.4 12.6 3.90721 12.6 7ZM14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7ZM3.88243 3.8823C4.17532 3.58941 4.65019 3.58941 4.94309 3.8823L7.00012 5.93934L9.05716 3.8823C9.35005 3.58941 9.82493 3.58941 10.1178 3.8823C10.4107 4.17519 10.4107 4.65007 10.1178 4.94296L8.06078 7L10.1178 9.05704C10.4107 9.34993 10.4107 9.8248 10.1178 10.1177C9.82493 10.4106 9.35005 10.4106 9.05716 10.1177L7.00012 8.06066L4.94309 10.1177C4.65019 10.4106 4.17532 10.4106 3.88243 10.1177C3.58953 9.8248 3.58953 9.34993 3.88243 9.05704L5.93946 7L3.88243 4.94296C3.58953 4.65007 3.58953 4.17519 3.88243 3.8823Z"
        fill={color || colors.darkBlue}
      />
    </Svg>
  );
}
