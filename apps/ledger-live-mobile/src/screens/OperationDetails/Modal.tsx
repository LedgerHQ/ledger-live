import React, { memo } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Currency } from "@ledgerhq/types-cryptoassets";
import QueuedDrawer from "../../components/QueuedDrawer";
import Circle from "../../components/Circle";
import IconInfo from "../../icons/Info";
import LText from "../../components/LText";
import Button from "../../components/Button";
import { rgba } from "../../colors";
import { urls } from "../../config/urls";

export type Props = {
  isOpened: boolean;
  onClose: () => void;
  currency: Currency;
};

function Modal({ isOpened, onClose, currency }: Props) {
  const { colors } = useTheme();
  const tokenType =
    currency.type === "TokenCurrency" ? currency.tokenType : "erc20";
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <Circle bg={rgba(colors.live, 0.1)} size={56}>
          <IconInfo size={24} color={colors.live} />
        </Circle>
        <LText style={styles.modalDesc} color="smoke">
          <Trans i18nKey="operationDetails.tokenModal.desc" />
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            event="TokenOperationsModalClose"
            type="secondary"
            title={<Trans i18nKey="common.close" />}
            containerStyle={styles.modalBtn}
            onPress={onClose}
          />
          <Button
            event="TokenOperationsModalLearnMore"
            type="primary"
            title={<Trans i18nKey="common.learnMore" />}
            containerStyle={[styles.modalBtn, styles.learnMore]}
            onPress={() =>
              Linking.openURL(
                urls.supportLinkByTokenType[
                  tokenType as keyof typeof urls.supportLinkByTokenType
                ],
              )
            }
          />
        </View>
      </SafeAreaView>
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  modalDesc: {
    textAlign: "center",
    marginVertical: 24,
  },
  modalBtn: {
    flexGrow: 1,
  },
  learnMore: {
    marginLeft: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
});
export default memo<Props>(Modal);
