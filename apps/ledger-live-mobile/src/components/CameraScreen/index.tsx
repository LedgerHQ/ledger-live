import React, { useCallback } from "react";
import { View } from "react-native";
import { rgba } from "../../utils/colors";
import QRCodeBottomLayer from "./QRCodeBottomLayer";
import { Box, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import ScanTargetSvg from "./ScanTargetSvg";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { track } from "../../analytics";

type Props = {
  width: number;
  height: number;
  progress?: number;
  liveQrCode?: boolean;
  instruction?: React.ReactNode | string;
};
export default function CameraScreen({ width, height, progress, liveQrCode, instruction }: Props) {
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
    });
    goBack();
  }, [goBack]);

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
      <Flex
        height={height * 0.15}
        backgroundColor={rgba(colors.constant.black, 0.8)}
        alignItems={"flex-end"}
        px={6}
        pt={9}
        zIndex={1}
      >
        <TouchableOpacity onPress={onClose}>
          <Flex
            bg={"neutral.c100"}
            width={"32px"}
            height={"32px"}
            alignItems={"center"}
            justifyContent={"center"}
            borderRadius={32}
          >
            <IconsLegacy.CloseMedium size={20} color={"neutral.c00"} />
          </Flex>
        </TouchableOpacity>
      </Flex>
      <Flex flexDirection={"row"} justifyContent={"space-evenly"} alignItems={"center"}>
        <Box flexGrow={1} backgroundColor={rgba(colors.constant.black, 0.8)} height={"100%"} />
        <ScanTargetSvg />
        <Box flexGrow={1} backgroundColor={rgba(colors.constant.black, 0.8)} height={"100%"} />
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
