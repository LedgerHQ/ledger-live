// @flow
import React from "react";
import Svg, { Path, G, Image } from "react-native-svg";
import manager from "@ledgerhq/live-common/lib/manager";
import { Flex } from "@ledgerhq/native-ui";
import AppIcon from "../screens/Manager/AppsList/AppIcon";

type Props = {
  size: number;
  color: string;
  icon: string;
  app: any;
};

export default function AppTree({ size = 150, color, icon, app }: Props) {
  const uri = manager.getIconUrl(icon);

  return (
    <Flex alignItems="center" justifyContent="center">
      <Flex mb={3}>
        <AppIcon app={app} size={48} />
      </Flex>
      <Svg width="163" height="50" viewBox="0 0 163 50" fill="none">
        <G opacity="0.25">
          <Image
            x="141"
            y="27"
            width="22"
            height="22"
            rx="11"
            ry="11"
            href={uri}
          />
        </G>
        <G opacity="0.25">
          <Image
            x="94"
            y="27"
            width="22"
            height="22"
            rx="11"
            ry="11"
            href={uri}
          />
        </G>
        <G opacity="0.25">
          <Image
            x="47"
            y="27"
            width="22"
            height="22"
            rx="11"
            ry="11"
            href={uri}
          />
        </G>
        <G opacity="0.25">
          <Image y="27" width="22" height="22" rx="11" ry="11" href={uri} />
        </G>
        <Path
          d="M82 3V11.5H13C11.8954 11.5 11 12.3954 11 13.5V20"
          stroke={color}
          stroke-width="1.5"
        />
        <Path
          d="M82 3V11.5H60C58.8954 11.5 58 12.3954 58 13.5V20"
          stroke={color}
          stroke-width="1.5"
        />
        <Path
          d="M82 3V11.5H150C151.105 11.5 152 12.3954 152 13.5V20"
          stroke={color}
          stroke-width="1.5"
        />
        <Path
          d="M82 0V11.5H103C104.105 11.5 105 12.3954 105 13.5V20"
          stroke={color}
          stroke-width="1.5"
        />
      </Svg>
    </Flex>
  );
}
