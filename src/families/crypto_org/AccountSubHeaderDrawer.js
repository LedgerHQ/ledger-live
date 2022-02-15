// @flow
import React from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "../../components/LText";
import BottomModal from "../../components/BottomModal";
import { urls } from "../../config/urls";
import ExternalLink from "../../components/ExternalLink";

type Props = {
  isOpen: boolean,
  onClose: () => void,
};

export default function AccountSubHeaderDrawer({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <BottomModal
      id="cryptoOrg-more-info-modal"
      isOpened={isOpen}
      onClose={onClose}
    >
      <View style={styles.container}>
        <LText style={styles.drawerTitle}>
          {t("cryptoOrg.account.subHeader.drawerTitle")}
        </LText>
        <LText style={styles.title}>
          {t("cryptoOrg.account.subHeader.title")}
        </LText>
        <LText style={styles.description}>
          {t("cryptoOrg.account.subHeader.description")}
        </LText>
        <LText style={styles.description}>
          {t("cryptoOrg.account.subHeader.description2")}
        </LText>
        <View style={styles.linkContainer}>
          <ExternalLink
            text={t("cryptoOrg.account.subHeader.website")}
            onPress={() => Linking.openURL(urls.cryptoOrg.website)}
            fontSize={14}
            event={"OpenCryptoOrgWebsite"}
          />
        </View>
      </View>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  drawerTitle: {
    fontSize: 22,
    textAlign: "center",
    paddingBottom: 16,
    fontWeight: "900",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
    paddingVertical: 8,
  },
  linkContainer: {
    marginVertical: 10,
    display: "flex",
    alignItems: "flex-start",
  },
  linkTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
});
