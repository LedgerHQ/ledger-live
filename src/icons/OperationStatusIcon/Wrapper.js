// @flow
import type { OperationType } from "@ledgerhq/live-common/lib/types";
import React, { useCallback } from "react";
import Svg, { Circle, G, Rect, Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size?: number,
  Icon: React$ComponentType<*>,
  confirmed?: boolean,
  failed?: boolean,
  type: OperationType,
};

export default function Wrapper({
  size,
  Icon,
  failed,
  confirmed,
  type,
}: Props) {
  const { colors } = useTheme();
  const opacity = !confirmed ? 0.05 : 0.2;

  const inferColor = useCallback(
    (type: OperationType) => {
      switch (type) {
        case "IN":
          return colors.success;
        case "FREEZE":
          return colors.live;
        case "REWARD":
          return colors.yellow;
        default:
          return colors.grey;
      }
    },
    [colors],
  );

  const color = failed ? colors.alert : inferColor(type);

  return (
    <Svg viewBox="0 0 26 26" width={size} height={size}>
      <G fill={color}>
        <Rect id="bg" opacity={opacity} width="24" height="24" rx="12" />
        <G x="6" y="6">
          <Icon size={12} color={color} />
        </G>
        {!confirmed ? (
          <G>
            <Path
              d="M12,0 C18.627,0 24,5.373 24,12 C24,18.627 18.627,24 12,24 C5.373,24 0,18.627 0,12 C0,5.373 5.373,0 12,0 Z M12,1 C5.925,1 1,5.925 1,12 C1,18.075 5.925,23 12,23 C18.075,23 23,18.075 23,12 C23,5.925 18.075,1 12,1 Z"
              id="stroke"
            />
            {!failed ? (
              <G
                id="clock"
                fill={colors.grey}
                transform="translate(14.000000, 14.000000)"
              >
                <Circle id="clockBg" fill={colors.card} cx="6" cy="6" r="6" />
                <Path d="M6,1.365 C7.65592603,1.365 9.1860648,2.24842597 10.0140278,3.68249997 C10.8419909,5.11657398 10.8419909,6.88342602 10.0140278,8.31750003 C9.1860648,9.75157403 7.65592603,10.635 6,10.635 C3.44016018,10.635 1.365,8.55983982 1.365,6 C1.365,3.44016018 3.44016018,1.365 6,1.365 Z M6,2.302 C3.957651,2.302 2.302,3.957651 2.302,6 C2.302,8.042349 3.957651,9.698 6,9.698 C8.042349,9.698 9.698,8.042349 9.698,6 C9.698,3.957651 8.042349,2.302 6,2.302 L6,2.302 Z M6.469,5.806 L7.581,6.919 C7.71176035,7.0345209 7.76758283,7.21308123 7.72590515,7.38251062 C7.68422747,7.55194002 7.55194002,7.68422747 7.38251062,7.72590515 C7.21308123,7.76758283 7.0345209,7.71176035 6.919,7.581 L5.669,6.331 C5.58060119,6.24346831 5.53060042,6.12440171 5.53,6 L5.53,3.5 C5.53,3.24097845 5.73997845,3.031 5.999,3.031 C6.25802155,3.031 6.468,3.24097845 6.468,3.5 L6.468,5.806 L6.469,5.806 Z" />
              </G>
            ) : null}
          </G>
        ) : null}
      </G>
    </Svg>
  );
}
