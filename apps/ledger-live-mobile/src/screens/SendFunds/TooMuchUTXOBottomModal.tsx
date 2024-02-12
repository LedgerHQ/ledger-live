import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import QueuedDrawer from "~/components/QueuedDrawer";
import LText from "~/components/LText";
import Button from "~/components/Button";
import Info from "~/icons/Info";
import TrackScreen from "~/analytics/TrackScreen";

type Props = {
  isOpened: boolean;
  onClose: () => void;
  onPress: () => void;
};

function ConfirmationModal({ isOpened, onClose, onPress, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <QueuedDrawer
      {...rest}
      isRequestingToBeOpened={isOpened}
      onClose={onClose}
      style={styles.confirmationModal}
    >
      {isOpened ? <TrackScreen category="LendingNoTokenAccountInfoModal" /> : null}
      <View
        style={[
          styles.icon,
          {
            backgroundColor: colors.lightOrange,
          },
        ]}
      >
        <Info size={24} color={colors.orange} />
      </View>
      <LText secondary semiBold style={styles.title}>
        <Trans i18nKey="send.tooMuchUTXOBottomModal.title" />
      </LText>
      <LText style={styles.description} color="smoke">
        <Trans i18nKey="send.tooMuchUTXOBottomModal.description" />
      </LText>
      <View style={styles.confirmationFooter}>
        <Button
          event="Send - Too much UTXO CTA"
          containerStyle={styles.confirmationButton}
          type="primary"
          title={<Trans i18nKey="send.tooMuchUTXOBottomModal.cta" />}
          onPress={onPress}
        />
      </View>
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  confirmationModal: {
    paddingVertical: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
  },
  description: {
    marginVertical: 32,
    textAlign: "center",
    fontSize: 14,
  },
  confirmationFooter: {
    justifyContent: "flex-end",
  },
  confirmationButton: {
    flexGrow: 1,
  },
  confirmationLastButton: {
    marginTop: 16,
  },
  icon: {
    alignSelf: "center",
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});
export default memo<Props>(ConfirmationModal);
