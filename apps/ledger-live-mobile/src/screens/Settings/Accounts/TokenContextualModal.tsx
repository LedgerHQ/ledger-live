import React, { useCallback, useState } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { connect } from "react-redux";
import type { TokenAccount, Account } from "@ledgerhq/types-live";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  getAccountContractExplorer,
  getDefaultExplorerView,
} from "@ledgerhq/live-common/explorers";
import { useNavigation } from "@react-navigation/native";
import LText from "~/components/LText";
import { blacklistToken } from "~/actions/settings";
import TokenContractAddress from "../../Account/TokenContractAddress";
import Button from "~/components/Button";
import { parentAccountSelector } from "~/reducers/accounts";
import CurrencyIcon from "~/components/CurrencyIcon";
import BottomModalChoice from "~/components/BottomModalChoice";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import { State } from "~/reducers/types";
import QueuedDrawer from "~/components/QueuedDrawer";

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
  const navigation = useNavigation<StackNavigatorNavigation<PortfolioNavigatorStackParamList>>();

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
    navigation.pop();
  }, [onCloseModal, blacklistToken, account, navigation]);

  // UPGRADE-RN77:
  // It should already be animated by the `react-native-modal` but currently `react-native-modal`
  // is not maintained and its animation dependency too. The internal animation is flaky and not
  // working properly on Android. So, we are using reanimated to enforce redraw after animation.
  const sharedHeight = useSharedValue(0);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: 200 });
    },
    [sharedHeight],
  );
  const animatedStyle = useAnimatedStyle(
    () => ({
      height: sharedHeight.value ?? 0,
    }),
    [sharedHeight],
  );

  if (!isOpened || !account) return null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const explorerView = mainAccount ? getDefaultExplorerView(mainAccount.currency) : null;
  const url =
    explorerView && parentAccount
      ? getAccountContractExplorer(explorerView, account, parentAccount)
      : null;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpened}
      preventBackdropClick={false}
      Icon={
        showingContextMenu ? (
          <CurrencyIcon size={48} currency={getAccountCurrency(account)} />
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
        <TokenContractAddress token={account.token} onClose={onCloseModal} url={url || ""} />
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
              containerStyle={[styles.confirmationButton, styles.confirmationLastButton]}
              type={"primary"}
              title={<Trans i18nKey="settings.accounts.blacklistedTokensModal.confirm" />}
              onPress={onBlacklistToken}
            />
          </View>
        </View>
      ) : (
        <Animated.ScrollView style={animatedStyle}>
          <Animated.View onLayout={onLayout}>
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
          </Animated.View>
        </Animated.ScrollView>
      )}
    </QueuedDrawer>
  );
};

const mapStateToProps = (state: State, ownProps: { account?: TokenAccount }) => ({
  parentAccount: parentAccountSelector(state, ownProps),
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
