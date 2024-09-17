import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import BottomContainer from "./BottomContainer";
import { CameraView } from "expo-camera/next";
import ScanTargetSvg from "./ScanTargetSvg";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import { BarCodeScanningResult } from "expo-camera";

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

  const onBarCodeScanned = ({ data }: BarCodeScanningResult) => {
    onQrCodeScanned(data);
  };

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
          <Trans
            i18nKey="walletSync.synchronize.qrCode.scan.explanation.steps.step2"
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
          {t("walletSync.synchronize.qrCode.scan.explanation.steps.step3")}
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
          <CameraView
            style={{
              backgroundColor: colors.neutral.c50,
              width: 280,
              height: 280,
            }}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={onBarCodeScanned}
          />
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
