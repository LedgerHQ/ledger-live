import React, { useCallback, useState } from "react";
import { connect } from "react-redux";
import type { TokenAccount, Account, SubAccount } from "@ledgerhq/types-live";
import { View, StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getAccountContractExplorer,
  getDefaultExplorerView,
} from "@ledgerhq/live-common/explorers";
import { createStructuredSelector } from "reselect";
import { useNavigation } from "@react-navigation/native";
import LText from "../../../components/LText";
import { blacklistToken } from "../../../actions/settings";
import TokenContractAddress from "../../Account/TokenContractAddress";
import Button from "../../../components/Button";
import { parentAccountSelector } from "../../../reducers/accounts";
import ParentCurrencyIcon from "../../../components/ParentCurrencyIcon";
import BottomModalChoice from "../../../components/BottomModalChoice";
import { NavigatorName } from "../../../const";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { PortfolioNavigatorStackParamList } from "../../../components/RootNavigator/types/PortfolioNavigator";
import { State } from "../../../reducers/types";
import QueuedDrawer from "../../../components/QueuedDrawer";

const mapDispatchToProps = {
  blacklistToken,
};
type OwnProps = {
  isOpened: boolean;
  onClose: () => void;
  account?: TokenAccount;
};
type Props = OwnProps & {
  parentAccount?: Account;
  blacklistToken: (_: string) => void;
};

const TokenContextualModal = ({
  isOpened,
  onClose,
  account,
  parentAccount,
  blacklistToken,
}: Props) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<PortfolioNavigatorStackParamList>>();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const showingContextMenu = !showConfirmation && !showContract;
  const onCloseModal = useCallback(() => {
    setShowConfirmation(false);
    setShowContract(false);
    onClose();
  }, [onClose]);
  const onBlacklistToken = useCallback(() => {
    if (!account) return;
    blacklistToken(account.token.id);
    onCloseModal();
    navigation.navigate(NavigatorName.WalletTab);
  }, [onCloseModal, blacklistToken, account, navigation]);

  if (!isOpened || !account) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const explorerView = mainAccount
    ? getDefaultExplorerView(mainAccount.currency)
    : null;
  const url = explorerView
    ? getAccountContractExplorer(explorerView, account, parentAccount!)
    : null;
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpened}
      preventBackdropClick={false}
      Icon={
        showingContextMenu ? (
          <ParentCurrencyIcon
            size={48}
            currency={getAccountCurrency(account)}
          />
        ) : undefined
      }
      title={showingContextMenu ? account.token.name : undefined}
      onClose={onCloseModal}
    >
      {!showingContextMenu && showConfirmation ? (
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
          <BottomModalChoice
            title={t("settings.accounts.hideTokenCTA")}
            onPress={() => setShowConfirmation(true)}
            iconName="EyeNone"
          />
          {url && (
            <BottomModalChoice
              title={t("settings.accounts.showContractCTA")}
              onPress={() => setShowContract(true)}
              iconName="News"
            />
          )}
        </>
      )}
    </QueuedDrawer>
  );
};

const mapStateToProps = createStructuredSelector<
  State,
  { account?: SubAccount },
  { parentAccount: Account | undefined }
>({
  parentAccount: parentAccountSelector,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TokenContextualModal) as React.ComponentType<OwnProps>;

const styles = StyleSheet.create({
  header: {
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
    paddingHorizontal: 16,
  },
});
