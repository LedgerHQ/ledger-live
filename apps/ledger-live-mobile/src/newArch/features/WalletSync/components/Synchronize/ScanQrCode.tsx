import React, { useCallback } from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import BottomContainer from "./BottomContainer";
import ScanTargetSvg from "./ScanTargetSvg";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import CameraPermissionContext from "~/components/RequiresCameraPermissions/CameraPermissionContext";

// Safe imports with fallback
let Camera: any, useCameraDevice: any, useCodeScanner: any;
try {
  const visionCamera = require("react-native-vision-camera");
  Camera = visionCamera.Camera;
  useCameraDevice = visionCamera.useCameraDevice;
  useCodeScanner = visionCamera.useCodeScanner;
} catch (error) {
  console.warn("react-native-vision-camera not available:", error);
  Camera = () => null;
  useCameraDevice = () => null;
  useCodeScanner = () => null;
}

type Props = {
  onQrCodeScanned: (data: string) => void;
};

const Italic = styled(Text)`
  font-style: italic;
`;
// Won't work since we don't have inter italic font

const ScanQrCode = ({ onQrCodeScanned }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const device = useCameraDevice ? useCameraDevice("back") : null;

  const codeScanner = useCodeScanner
    ? useCodeScanner({
        codeTypes: ["qr"],
        onCodeScanned: useCallback(
          (codes: any[]) => {
            if (codes.length > 0 && codes[0].value) {
              onQrCodeScanned(codes[0].value);
            }
          },
          [onQrCodeScanned],
        ),
      })
    : null;

  const steps = [
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.scan.explanation.steps.step1")}
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.scan.explanation.steps.step2")}
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          <Trans
            i18nKey="walletSync.synchronize.qrCode.scan.explanation.steps.step3"
            components={[
              <Italic key={0} color={colors.opacityDefault.c70} />,
              <Text key={1} flex={1} color={colors.opacityDefault.c30} />,
            ]}
          />
        </Text>
      ),
    },
    {
      description: (
        <Text variant="body" flex={1} fontSize={14} color={colors.opacityDefault.c70}>
          {t("walletSync.synchronize.qrCode.scan.explanation.steps.step4")}
        </Text>
      ),
    },
  ];

  return (
    <Flex
      minHeight={400}
      justifyContent={"center"}
      alignItems={"center"}
      rowGap={24}
      testID={"ws-scan-camera"}
    >
      <RequiresCameraPermissions optimisticallyMountChildren fallBackHasNoBackground>
        <Flex
          borderRadius={36}
          overflow={"hidden"}
          position={"relative"}
          width={288}
          height={288}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <CameraPermissionContext.Consumer>
            {({ permissionGranted }) =>
              permissionGranted && device && Camera && codeScanner ? (
                <Camera
                  device={device}
                  isActive={permissionGranted}
                  style={{
                    backgroundColor: colors.neutral.c50,
                    width: 280,
                    height: 280,
                  }}
                  codeScanner={codeScanner}
                />
              ) : (
                <Flex
                  style={{
                    backgroundColor: colors.neutral.c50,
                    width: 280,
                    height: 280,
                  }}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color={colors.neutral.c80}>
                    {!permissionGranted
                      ? "Camera permission required"
                      : !Camera
                        ? "Camera module not available"
                        : "Camera not available"}
                  </Text>
                </Flex>
              )
            }
          </CameraPermissionContext.Consumer>
          <ScanTargetSvg style={{ position: "absolute" }} />
        </Flex>
        <Flex flexDirection={"row"} alignItems={"center"} columnGap={8}>
          <Text variant="bodyLineHeight">
            {t("walletSync.synchronize.qrCode.scan.description")}
          </Text>
          <Icons.QrCode />
        </Flex>
        <BottomContainer steps={steps} />
      </RequiresCameraPermissions>
    </Flex>
  );
};

export default ScanQrCode;
