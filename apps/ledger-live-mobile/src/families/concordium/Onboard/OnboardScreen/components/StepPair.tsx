import React from "react";
import { Image, Linking, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Alert, Button, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import QRCode from "react-native-qrcode-svg";
import { Trans } from "~/context/Locale";
import { PairStatus, usePairing } from "../hooks/usePairing";
import { useIdAppDetection } from "../hooks/useIdAppDetection";
import appleStoreBadge from "../images/get_it_on_apple_store.png";
import googlePlayBadge from "../images/get_it_on_google_play.png";

const storeBadge = Platform.OS === "ios" ? appleStoreBadge : googlePlayBadge;

export default function StepPair({
  currency,
  onPaired,
}: Readonly<{
  currency: CryptoCurrency;
  onPaired: (sessionTopic: string) => void;
}>) {
  const { pairStatus, walletConnectUri, startPairing } = usePairing(currency, onPaired);
  const { isInstalled, openIdApp, storeUrl } = useIdAppDetection();

  return (
    <Flex flex={1} justifyContent="space-between">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Flex alignItems="center">
          <Text variant="h5" fontWeight="semiBold" mb={6}>
            <Trans i18nKey="concordium.onboard.pair.title" />
          </Text>

          {pairStatus === PairStatus.CONNECTING && (
            <Flex alignItems="center" justifyContent="center" py={10}>
              <InfiniteLoader size={40} />
              <Text variant="body" color="neutral.c70" mt={4}>
                <Trans i18nKey="concordium.onboard.pair.connecting" />
              </Text>
            </Flex>
          )}

          {pairStatus === PairStatus.QR_READY && walletConnectUri && (
            <Flex alignItems="center">
              {isInstalled === null && (
                <Flex alignItems="center" justifyContent="center" py={10}>
                  <InfiniteLoader size={40} />
                </Flex>
              )}

              {isInstalled === true && (
                <Flex alignItems="center" pt={4}>
                  <Button
                    type="main"
                    onPress={() => openIdApp(walletConnectUri)}
                    accessibilityRole="button"
                  >
                    <Trans i18nKey="concordium.onboard.pair.openIdApp" />
                  </Button>
                </Flex>
              )}

              {isInstalled === false && (
                <Flex alignItems="center">
                  <Flex
                    backgroundColor="constant.white"
                    borderRadius={16}
                    p={4}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <QRCode value={walletConnectUri} size={200} />
                  </Flex>
                  <Text variant="body" color="neutral.c70" mt={4} textAlign="center" px={4}>
                    <Trans i18nKey="concordium.onboard.pair.scanQRCodeOrDownload" />
                  </Text>
                  <Flex mt={8}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL(storeUrl)}
                      accessibilityRole="link"
                      accessibilityLabel={
                        Platform.OS === "ios"
                          ? "Download on the App Store"
                          : "Get it on Google Play"
                      }
                    >
                      <Image
                        source={storeBadge}
                        style={{ height: 40, width: 135 }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </Flex>
                </Flex>
              )}
            </Flex>
          )}

          {pairStatus === PairStatus.ERROR && (
            <Flex alignItems="center">
              <Alert type="error">
                <Alert.BodyText>
                  <Trans i18nKey="concordium.onboard.pair.error" />
                </Alert.BodyText>
              </Alert>
            </Flex>
          )}
        </Flex>
      </ScrollView>

      {pairStatus === PairStatus.ERROR && (
        <Flex px={6} pb={10}>
          <Button type="main" onPress={startPairing} accessibilityRole="button">
            <Trans i18nKey="common.retry" />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
