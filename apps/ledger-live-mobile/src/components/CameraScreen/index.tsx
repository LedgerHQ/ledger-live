import React from "react";
import { View } from "react-native";
import { rgba } from "../../colors";
import QRCodeBottomLayer from "./QRCodeBottomLayer";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import ScanTargetSvg from "./ScanTargetSvg";

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
        height={height * 0.15}
        backgroundColor={rgba(colors.constant.black, 0.8)}
      ></Box>
      <Flex
        flexDirection={"row"}
        justifyContent={"space-evenly"}
        alignItems={"center"}
      >
        <Box
          flexGrow={1}
          backgroundColor={rgba(colors.constant.black, 0.8)}
          height={"100%"}
        />
        <ScanTargetSvg />
        <Box
          flexGrow={1}
          backgroundColor={rgba(colors.constant.black, 0.8)}
          height={"100%"}
        />
      </Flex>
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
