import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Button, Icons, Flex, Link } from "@ledgerhq/native-ui";
import forgetDeviceIllustration from "../assets/forget-device.webp";
import { useTheme } from "styled-components/native";
import { useForgetDeviceCta } from "./hooks/useForgetDeviceCta";
import { TrackScreen } from "~/analytics";

type BleForgetDeviceIllustrationProps = {
  productName: string;
  onRetry: () => void;
};

export function BleForgetDeviceIllustration({
  productName,
  onRetry,
}: Readonly<BleForgetDeviceIllustrationProps>) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { onLearnHowToFixPress, onRetryPress } = useForgetDeviceCta({ onRetry });

  return (
    <>
      <TrackScreen category="unpair_required" />
      <Image source={forgetDeviceIllustration} resizeMode="contain" style={styles.image} />
      <View style={styles.view}>
        <Text variant="h4" style={styles.title}>
          {t("blePairingFlow.pairing.error.forgetDevice.title", { productName })}
        </Text>
        <Text
          variant="body"
          textAlign={"center"}
          lineHeight="21px"
          color="neutral.c80"
          style={styles.description}
        >
          {t("blePairingFlow.pairing.error.forgetDevice.description", { productName })}
        </Text>
      </View>
      <Flex mt={16} mb={24}>
        <Button
          type="main"
          size={"large"}
          Icon={() => <Icons.ExternalLink size="M" color={colors.neutral.c20} />}
          iconPosition="right"
          mb={24}
          onPress={onLearnHowToFixPress}
        >
          {t("blePairingFlow.pairing.error.forgetDevice.learnHowToFixCta")}
        </Button>
        <Link size="large" onPress={onRetryPress}>
          {t("blePairingFlow.pairing.error.forgetDevice.tryAgainCta")}
        </Link>
      </Flex>
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 198,
    height: 172,
    alignSelf: "center",
  },
  view: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 0,
  },
  title: {
    fontWeight: "600",
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontWeight: "500",
    fontSize: 14,
    fontStyle: "normal",
    marginHorizontal: 20,
  },
});
