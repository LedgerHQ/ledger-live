import React, { useCallback, useState, useEffect } from "react";
import { Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, Icons, Text, Box } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { CameraType } from "expo-camera/build/Camera.types";
import { Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Svg, Defs, Rect, Mask, Circle } from "react-native-svg";
import { urls } from "../../config/urls";
import CameraScreen from "../../components/CameraScreen";
import Scanner from "../../components/Scanner";

const WrappedSvg = () => (
  <Svg height="320px" width="100%" viewBox="0 0 100 100">
    <Defs>
      <Mask id="mask" x="0" y="0" height="320px" width="100%">
        <Rect height="20px" width="100%" fill="#fff" />
      </Mask>
    </Defs>
    <Rect
      height="320px"
      width="100%"
      fill="rgba(0, 0, 0, 0.5)"
      mask="url(#mask)"
      fill-opacity="0"
    />
  </Svg>
);

const ClaimNftQrScan = () => {
  const { t } = useTranslation();
  const [permission, requestPermission] = Camera.useCameraPermissions();

  const handleBarCodeScanned = useCallback(({ data }) => {
    try {
      const url = new URL(data);
      const { hostname } = url;
      const code = url.href.substring(url.href.lastIndexOf("/") + 1);
      const deeplink =
        hostname === "staging.claim.ledger.com"
          ? urls.discover.linkDropStaging +
            "?redirectToOnboarding=true&autoClaim=true&code="
          : urls.discover.linkDrop +
            "?redirectToOnboarding=true&autoClaim=true&code=";
      Linking.openURL(deeplink + code);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex
          backgroundColor="neutral.c40"
          alignItems="center"
          justifyContent="center"
          height={320}
          width="100%"
          //          overflow="hidden"
        >
          <Camera
            type={CameraType.back}
            style={{
              height: "100%",
              width: "100%",
              alignSelf: "center",
            }}
            onBarCodeScanned={handleBarCodeScanned}
            barCodeScannerSettings={{
              barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
            }}
            ratio="1:1"
          >
            <CameraScreen width={400} height={320} liveQrCode />
            {/* TODO: Finish this component => <WrappedSvg /> ALSO TRY WITH <Scanner onResult={handleBarCodeScanned} liveQrCode /> */}
          </Camera>
        </Flex>
        <Flex flex={1} px={7} alignItems="center">
          <Text
            variant="h4"
            fontWeight="semiBold"
            mt={7}
            mb={6}
            textAlign="center"
          >
            {t("claimNft.qrScan.title")}
          </Text>
          <Text color="neutral.c70" mb={6} textAlign="center">
            {t("claimNft.qrScan.description.1")}
          </Text>
          <Text color="neutral.c70" mb={6} textAlign="center">
            {t("claimNft.qrScan.description.2")}
          </Text>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};

export default ClaimNftQrScan;
