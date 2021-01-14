// @flow
import React, { useCallback, useState } from "react";
import { connect } from "react-redux";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import {
  getAccountContractExplorer,
  getDefaultExplorerView,
} from "@ledgerhq/live-common/lib/explorers";
import { createStructuredSelector } from "reselect";
import { useTheme } from "@react-navigation/native";
import BottomModal from "../../../components/BottomModal";
import LText from "../../../components/LText";
import CurrencyIcon from "../../../components/CurrencyIcon";
import BanIcon from "../../../icons/Ban";
import Touchable from "../../../components/Touchable";
import { blacklistToken } from "../../../actions/settings";
import TokenContractAddress from "../../Account/TokenContractAddress";
import Button from "../../../components/Button";
import { parentAccountSelector } from "../../../reducers/accounts";

const mapDispatchToProps = {
  blacklistToken,
};

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const TokenContextualModal = ({
  isOpened,
  onClose,
  account,
  parentAccount,
  blacklistToken,
}: {
  isOpened: boolean,
  onClose: () => void,
  account: TokenAccount,
  parentAccount: Account,
  blacklistToken: string => void,
}) => {
  const { colors } = useTheme();
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const explorerView = mainAccount
    ? getDefaultExplorerView(mainAccount.currency)
    : null;
  const url = explorerView
    ? getAccountContractExplorer(explorerView, account, parentAccount)
    : null;

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const showingContextMenu = !showConfirmation && !showContract;

  const onCloseModal = useCallback(() => {
    setShowConfirmation(false);
    setShowContract(false);
    onClose();
  }, [onClose]);

  const onBlacklistToken = useCallback(() => {
    blacklistToken(account.token.id);
    onCloseModal();
  }, [onCloseModal, blacklistToken, account]);

  if (!isOpened || !account) return null;

  return (
    <BottomModal
      id="ContractAddress"
      isOpened={isOpened}
      preventBackdropClick={false}
      onClose={onCloseModal}
    >
      {showingContextMenu ? (
        <View style={[styles.header, { borderColor: colors.fog }]}>
          <View style={{ marginRight: 12 }}>
            <CurrencyIcon currency={account.token} size={24} />
          </View>
          <LText>{account.token.name}</LText>
        </View>
      ) : showConfirmation ? (
        <LText secondary semiBold style={styles.confirmationHeader}>
          <Trans i18nKey="settings.accounts.blacklistedTokensModal.title" />
        </LText>
      ) : null}

      {showContract && url ? (
        <TokenContractAddress
          token={account.token}
          onClose={onCloseModal}
          url={url || ""}
        />
      ) : showConfirmation ? (
        <View style={styles.body}>
          <LText style={styles.confirmationDesc} color="smoke">
            <Trans i18nKey="settings.accounts.blacklistedTokensModal.desc">
              {"This action will hide all "}
              <LText bold>{account.token && account.token.name}</LText>
              {" accounts, you can restore their visibility at any time from "}
              <LText bold>{"1Settings"}</LText>
            </Trans>
          </LText>
          <View style={styles.confirmationFooter}>
            <Button
              event="ConfirmationModalCancel"
              containerStyle={styles.confirmationButton}
              type="secondary"
              title={<Trans i18nKey="common.cancel" />}
              onPress={onCloseModal}
            />
            <Button
              event="ConfirmationModalConfirm"
              containerStyle={[
                styles.confirmationButton,
                styles.confirmationLastButton,
              ]}
              type={"primary"}
              title={
                <Trans i18nKey="settings.accounts.blacklistedTokensModal.confirm" />
              }
              onPress={onBlacklistToken}
            />
          </View>
        </View>
      ) : (
        <>
          <Touchable
            hitSlop={hitSlop}
            onPress={() => setShowConfirmation(true)}
            style={styles.item}
            event="blacklistToken"
          >
            <View style={{ marginRight: 8 }}>
              <BanIcon size={18} color={colors.smoke} />
            </View>
            <LText semiBold>
              <Trans i18nKey="settings.accounts.hideTokenCTA" />
            </LText>
          </Touchable>
          {url && (
            <Touchable
              hitSlop={hitSlop}
              onPress={() => setShowContract(true)}
              style={styles.item}
              event="blacklistToken"
            >
              <View style={{ marginRight: 8 }}>
                <Icon name="file-text" size={18} color={colors.smoke} />
              </View>
              <LText semiBold>
                <Trans i18nKey="settings.accounts.showContractCTA" />
              </LText>
            </Touchable>
          )}
        </>
      )}
    </BottomModal>
  );
};

const mapStateToProps = createStructuredSelector({
  parentAccount: parentAccountSelector,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TokenContextualModal);

const styles = StyleSheet.create({
  header: {
    fontSize: 16,
    textAlign: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 16,
    width: "100%",
  },
  confirmationHeader: {
    fontSize: 18,
    textAlign: "center",
    flexDirection: "row",
    paddingTop: 16,
    width: "100%",
  },
  modal: {
    width: "100%",
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
  confirmationDesc: {
    marginVertical: 24,
    paddingHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
  },
  confirmationButton: {
    flexGrow: 1,
  },
  confirmationLastButton: {
    marginLeft: 16,
  },
  confirmationFooter: {
    flexDirection: "row",
  },
  body: {
    padding: 16,
  },
});
