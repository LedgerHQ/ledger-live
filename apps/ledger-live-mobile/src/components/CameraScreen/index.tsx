import React from "react";
import { View } from "react-native";
import { rgba } from "../../colors";
import QRCodeBottomLayer from "./QRCodeBottomLayer";
import QRCodeRectangleViewport from "./QRCodeRectangleViewport";
import { Box } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

type Props = {
  width: number;
  height: number;
  progress?: number;
  liveQrCode?: boolean;
  instruction?: React.ReactNode | string;
};
export default function CameraScreen({
  width,
  height,
  liveQrCode,
  instruction,
}: Props) {
  const progress = undefined;
  const { colors } = useTheme();
  // Make the viewfinder borders 2/3 of the screen shortest border
  const viewFinderSize = (width > height ? height : width) * (2 / 3);
  const wrapperStyle =
    width > height
      ? {
          height,
          alignSelf: "stretch" as const,
        }
      : {
          width,
          flexGrow: 1,
        };
  return (
    <View style={wrapperStyle}>
      <Box
        height={height * 0.18}
        backgroundColor={rgba(colors.constant.black, 0.8)}
      ></Box>
      <QRCodeRectangleViewport viewFinderSize={viewFinderSize} />
      <Box backgroundColor={rgba(colors.constant.black, 0.8)} flex={1}>
        <QRCodeBottomLayer
          liveQrCode={liveQrCode}
          progress={progress}
          instruction={instruction}
        ></QRCodeBottomLayer>
      </Box>
    </View>
  );
}
