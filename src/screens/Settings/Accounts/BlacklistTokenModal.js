// @flow
import React, { useCallback, useState } from "react";
import { connect } from "react-redux";
import type { TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import BottomModal from "../../../components/BottomModal";
import LText from "../../../components/LText";
import CurrencyIcon from "../../../components/CurrencyIcon";
import BanIcon from "../../../icons/Ban";
import Touchable from "../../../components/Touchable";
import { blacklistToken } from "../../../actions/settings";
import colors from "../../../colors";
import ConfirmationModal from "../../../components/ConfirmationModal";

const mapDispatchToProps = {
  blacklistToken,
};

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const BlacklistTokenModal = ({
  isOpened,
  onClose,
  token,
  blacklistToken,
  onShowContract,
}: {
  isOpened: boolean,
  onClose: () => void,
  token: TokenCurrency,
  blacklistToken: string => void,
  onShowContract: boolean => void,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const onCloseModal = useCallback(() => {
    setShowConfirmation(false);
    onClose();
  }, [onClose]);

  const onBlacklistToken = useCallback(() => {
    blacklistToken(token.id);
    onCloseModal();
  }, [onCloseModal, blacklistToken, token]);

  if (!isOpened) return null;

  return showConfirmation ? (
    <ConfirmationModal
      isOpened
      onClose={onCloseModal}
      onConfirm={onBlacklistToken}
      confirmationTitle={
        <Trans i18nKey="settings.accounts.blacklistedTokensModal.title" />
      }
      confirmationDesc={
        <Trans i18nKey="settings.accounts.blacklistedTokensModal.desc">
          {"1This action will hide all "}
          <LText bold>{token && token.name}</LText>
          {" accounts, you can restore their visibility at any time from "}
          <LText bold>{"1Settings"}</LText>
        </Trans>
      }
      confirmButtonText={
        <Trans i18nKey="settings.accounts.blacklistedTokensModal.confirm" />
      }
    />
  ) : (
    <BottomModal
      id="BlacklistModal"
      isOpened
      preventBackdropClick={false}
      onClose={onCloseModal}
    >
      {token ? (
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <View style={{ marginRight: 12 }}>
              <CurrencyIcon currency={token} size={24} />
            </View>
            <LText>{token.name}</LText>
          </View>
          <Touchable
            hitSlop={hitSlop}
            onPress={() => setShowConfirmation(true)}
            style={styles.item}
            event="blacklistToken"
          >
            <View style={{ marginRight: 8 }}>
              <BanIcon size={18} color={colors.smoke} />
            </View>
            <LText tertiary>
              <Trans i18nKey="settings.accounts.hideTokenCTA" />
            </LText>
          </Touchable>
          {onShowContract ? (
            <Touchable
              hitSlop={hitSlop}
              onPress={() => onShowContract(true)}
              style={styles.item}
              event="blacklistToken"
            >
              <View style={{ marginRight: 8 }}>
                <Icon name="file-text" size={18} color={colors.smoke} />
              </View>
              <LText tertiary>
                <Trans i18nKey="settings.accounts.showContractCTA" />
              </LText>
            </Touchable>
          ) : null}
        </SafeAreaView>
      ) : null}
    </BottomModal>
  );
};

export default connect(
  null,
  mapDispatchToProps,
)(BlacklistTokenModal);

const styles = StyleSheet.create({
  header: {
    justifyContent: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: colors.fog,
    paddingVertical: 16,
    width: "100%",
  },
  modal: {
    width: "100%",
  },
  modalDesc: {
    textAlign: "center",
    color: colors.smoke,
    marginVertical: 24,
  },
  modalBtn: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  item: {
    padding: 18,
    height: 40,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
});
