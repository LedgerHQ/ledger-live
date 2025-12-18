import React from "react";
import { Box, Flex, Icons, NumberedList, ProgressBar, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { Camera } from "react-native-vision-camera";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import CameraPermissionContext from "~/components/RequiresCameraPermissions/CameraPermissionContext";
import ScanTargetSvg from "./CameraScreen/ScanTargetSvg";
import { useQRScanner } from "LLM/hooks/useQRScanner";

type Props = {
  onResult: (data: string) => void;
  liveQRCode?: boolean;
  progress?: number;
};

const ScanQrCode = ({ onResult, liveQRCode = false, progress }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { device, codeScanner } = useQRScanner(onResult);

  return (
    <Flex
      flex={1}
      justifyContent="flex-start"
      alignItems={"center"}
      rowGap={24}
      testID={"scan-camera"}
    >
      <Box height={100} />
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
        <Flex flexDirection={"row"} alignItems={"center"} columnGap={8}>
          <Text variant="bodyLineHeight">
            {t("walletSync.synchronize.qrCode.scan.description")}
          </Text>
          <Icons.QrCode />
        </Flex>
        {liveQRCode && (
          <Flex p={3}>
            <Text variant={"h5"} fontWeight={"semiBold"} mb={6}>
              <Trans
                i18nKey={liveQRCode ? "account.import.newScan.title" : "send.scan.descBottom"}
              />
            </Text>

            <>
              {progress !== undefined && progress > 0 ? (
                <Box>
                  <Text variant={"body"} color={"neutral.c80"} mb={6}>
                    <Trans i18nKey={"account.import.newScan.hodl"} />
                  </Text>
                  <ProgressBar
                    length={100}
                    index={Math.floor((progress || 0) * 100)}
                    bg={"neutral.c40"}
                    height={8}
                    borderRadius={2}
                    activeBarProps={{ bg: "primary.c80", borderRadius: 2 }}
                  />
                </Box>
              ) : (
                <NumberedList
                  items={[
                    {
                      description: <Trans i18nKey={"account.import.newScan.instructions.line1"} />,
                    },
                    {
                      description: <Trans i18nKey={"account.import.newScan.instructions.line2"} />,
                    },
                    {
                      description: <Trans i18nKey={"account.import.newScan.instructions.line3"} />,
                    },
                  ]}
                  itemContainerProps={{ mb: 3 }}
                />
              )}
            </>
          </Flex>
        )}
      </RequiresCameraPermissions>
    </Flex>
  );
};

export default ScanQrCode;
