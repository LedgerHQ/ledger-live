import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "~/context/Locale";
import styled, { useTheme } from "styled-components/native";
import BottomContainer from "./BottomContainer";
import { Camera } from "react-native-vision-camera";
import ScanTargetSvg from "./ScanTargetSvg";
import { QR_CODE_TAB_FRAME_SIZE, QrCodeTabCaption } from "./QrCodeTabCaption";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import CameraPermissionContext from "~/components/RequiresCameraPermissions/CameraPermissionContext";
import { useQRScanner } from "LLM/hooks/useQRScanner";

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
  const { device, codeScanner } = useQRScanner(onQrCodeScanned);

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
          width={QR_CODE_TAB_FRAME_SIZE}
          height={QR_CODE_TAB_FRAME_SIZE}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <CameraPermissionContext.Consumer>
            {({ permissionGranted }) =>
              permissionGranted && device ? (
                <Camera
                  device={device}
                  isActive
                  style={{
                    backgroundColor: colors.neutral.c50,
                    width: 280,
                    height: 280,
                  }}
                  codeScanner={codeScanner}
                />
              ) : null
            }
          </CameraPermissionContext.Consumer>
          <ScanTargetSvg style={{ position: "absolute" }} />
        </Flex>
        <QrCodeTabCaption />
        <BottomContainer steps={steps} />
      </RequiresCameraPermissions>
    </Flex>
  );
};

export default ScanQrCode;
