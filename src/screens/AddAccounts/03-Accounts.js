// @flow

import React, { PureComponent, createRef } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import i18next from "i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";
import { createStructuredSelector } from "reselect";
import uniq from "lodash/uniq";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import { addAccount } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import PreventNativeBack from "../../components/PreventNativeBack";
import StepHeader from "../../components/StepHeader";
import SelectableAccountsList from "../../components/SelectableAccountsList";
import LiveLogo from "../../icons/LiveLogoIcon";
import IconPause from "../../icons/Pause";
import Spinning from "../../components/Spinning";
import LText from "../../components/LText";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
      deviceId: string,
    },
  }>,
  addAccount: Account => void,
  existingAccounts: Account[],
};

type State = {
  scanning: boolean,
  error: ?Error,
  scannedAccounts: Account[],
  selectedIds: string[],
  cancelled: boolean,
};

const mapStateToProps = createStructuredSelector({
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  addAccount,
};

class AddAccountsAccounts extends PureComponent<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("tabs.accounts")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "3",
          totalSteps: "3",
        })}
      />
    ),
    gesturesEnabled: false,
  };

  state = {
    // we assume status is scanning at beginning because we start sync at mount
    scanning: true,
    error: null,
    scannedAccounts: [],
    selectedIds: [],
    cancelled: false,
  };

  componentDidMount() {
    this.startSubscription();
  }

  componentWillUnmount() {
    this.stopSubscription(false);
  }

  handleContentSizeChange = () => {
    if (this.scrollView.current) {
      this.scrollView.current.scrollToEnd({ animated: true });
    }
  };

  startSubscription = () => {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    const deviceId = navigation.getParam("deviceId");
    const bridge = getCurrencyBridge(currency);

    this.scanSubscription = bridge
      .scanAccountsOnDevice(currency, deviceId)
      .subscribe({
        next: account =>
          this.setState(({ scannedAccounts, selectedIds }) => {
            const patch = {
              scannedAccounts: [...scannedAccounts, account],
            };
            if (!isAccountEmpty(account) && !this.isExistingAccount(account)) {
              // $FlowFixMe
              patch.selectedIds = [...selectedIds, account.id];
            }
            return patch;
          }),
        complete: () => this.setState({ scanning: false }),
        error: error => this.setState({ error }),
      });
  };

  restartSubscription = () => {
    this.setState({
      scanning: true,
      scannedAccounts: [],
      selectedIds: [],
      error: null,
      cancelled: false,
    });
    this.startSubscription();
  };

  stopSubscription = (syncUI = true) => {
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
      this.scanSubscription = null;
      if (syncUI) {
        this.setState({ scanning: false });
      }
    }
  };

  quitFlow = () => {
    this.props.navigation.navigate("Accounts");
  };

  scanSubscription: *;

  onPressAccount = (account: Account) => {
    const { selectedIds } = this.state;
    const isChecked = selectedIds.indexOf(account.id) > -1;
    const newSelectedIds = isChecked
      ? selectedIds.filter(id => id !== account.id)
      : [...selectedIds, account.id];
    this.setState({ selectedIds: newSelectedIds });
  };

  selectAll = accounts =>
    this.setState(({ selectedIds }) => ({
      selectedIds: uniq([...selectedIds, ...accounts.map(a => a.id)]),
    }));

  unselectAll = accounts =>
    this.setState(({ selectedIds }) => ({
      selectedIds: selectedIds.filter(id => !accounts.find(a => a.id === id)),
    }));

  import = () => {
    const { addAccount, navigation } = this.props;
    const { scannedAccounts, selectedIds } = this.state;
    const currency = navigation.getParam("currency");
    scannedAccounts.forEach(account => {
      if (selectedIds.indexOf(account.id) === -1) return;
      addAccount(account);
    });
    if (navigation.replace) {
      navigation.replace("AddAccountsSuccess", { currency });
    }
  };

  // FIXME: would be better to refactor these into pure (props,state) => functions because it's used not only in render()

  isExistingAccount = account =>
    this.props.existingAccounts.find(a => a.id === account.id) !== undefined;

  getExistingAccounts = () => {
    const { scannedAccounts } = this.state;
    const { existingAccounts } = this.props;
    return scannedAccounts
      .filter(this.isExistingAccount)
      .map(a => existingAccounts.find(acc => acc.id === a.id) || a);
  };

  getNewAccounts = () =>
    this.state.scannedAccounts.filter(
      a => isAccountEmpty(a) && !this.isExistingAccount(a),
    );

  getRegularAccounts = () =>
    this.state.scannedAccounts.filter(
      a => !isAccountEmpty(a) && !this.isExistingAccount(a),
    );

  EmptyStateNewAccounts = () => {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <LText style={styles.paddingHorizontal}>
        <Trans i18nKey="addAccounts.noAccountToCreate">
          {"PLACEHOLDER-1"}
          <LText semiBold>{currency.name}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    );
  };

  EmptyStateNewAccountsCantCreate = () => {
    const { scannedAccounts } = this.state;
    const { existingAccounts } = this.props;
    const emptyAccount = scannedAccounts.find(isAccountEmpty);
    if (!emptyAccount) {
      // this should never happen
      return null;
    }
    const correspondingAccount = existingAccounts.find(
      a => a.id === emptyAccount.id,
    );
    if (!correspondingAccount) {
      // this should never happen
      return null;
    }
    return (
      <LText style={styles.paddingHorizontal}>
        <Trans i18nKey="addAccounts.cantCreateAccount">
          {"PLACEHOLDER-1"}
          <LText semiBold>{correspondingAccount.name}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    );
  };

  onCancel = () => {
    this.setState({
      error: null,
      cancelled: true,
    });
  };

  onModalHide = () => {
    const { cancelled } = this.state;
    const { navigation } = this.props;

    if (cancelled && navigation.dismiss) {
      navigation.dismiss();
    }
  };

  onAccountNameChange = (name: string, changedAccount: Account) => {
    this.setState(prevState => ({
      scannedAccounts: prevState.scannedAccounts.map(account =>
        account.id === changedAccount.id ? { ...account, name } : account,
      ),
    }));
  };

  scrollView = createRef();

  render() {
    const { selectedIds, scanning, scannedAccounts, error } = this.state;
    const newAccounts = this.getNewAccounts();
    const regularAccounts = this.getRegularAccounts();
    const existingAccountsFiltered = this.getExistingAccounts();
    const cantCreateAccount =
      !!scannedAccounts.find(a => isAccountEmpty(a)) &&
      newAccounts.length === 0;
    const noImportableAccounts =
      regularAccounts.length === 0 && newAccounts.length === 0;

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="AddAccounts" name="Accounts" />
        <PreventNativeBack />
        <ScrollView
          style={styles.inner}
          contentContainerStyle={styles.innerContent}
          ref={this.scrollView}
          onContentSizeChange={this.handleContentSizeChange}
        >
          {regularAccounts.length > 0 ? (
            <SelectableAccountsList
              showHint={true}
              header={<Trans i18nKey="addAccounts.sections.accountsToImport" />}
              onAccountNameChange={this.onAccountNameChange}
              index={0}
              accounts={regularAccounts}
              onPressAccount={this.onPressAccount}
              onSelectAll={this.selectAll}
              onUnselectAll={this.unselectAll}
              selectedIds={selectedIds}
            />
          ) : scanning ? (
            <LText style={styles.descText}>
              <Trans i18nKey="addAccounts.synchronizingDesc" />
            </LText>
          ) : null}
          {scanning && <ScanLoading />}
          {(newAccounts.length > 0 || !scanning) && (
            <SelectableAccountsList
              header={<Trans i18nKey="addAccounts.sections.addNewAccount" />}
              onAccountNameChange={this.onAccountNameChange}
              index={1}
              showHint={regularAccounts.length === 0}
              accounts={newAccounts}
              onPressAccount={this.onPressAccount}
              selectedIds={selectedIds}
              EmptyState={
                cantCreateAccount
                  ? this.EmptyStateNewAccountsCantCreate
                  : this.EmptyStateNewAccounts
              }
            />
          )}
          {existingAccountsFiltered.length > 0 && (
            <SelectableAccountsList
              header={<Trans i18nKey="addAccounts.sections.existing" />}
              index={2}
              accounts={existingAccountsFiltered}
              forceSelected
              isDisabled
            />
          )}
        </ScrollView>
        {!!scannedAccounts.length && (
          <Footer
            isScanning={scanning}
            canRetry={!scanning && noImportableAccounts && !cantCreateAccount}
            canDone={!scanning && cantCreateAccount && noImportableAccounts}
            onRetry={this.restartSubscription}
            onStop={this.stopSubscription}
            onDone={this.quitFlow}
            onContinue={this.import}
            isDisabled={selectedIds.length === 0}
          />
        )}
        <GenericErrorBottomModal
          error={error}
          onModalHide={this.onModalHide}
          footerButtons={
            <>
              <CancelButton
                containerStyle={styles.button}
                onPress={this.onCancel}
              />
              <RetryButton
                containerStyle={[styles.button, styles.buttonRight]}
                onPress={this.restartSubscription}
              />
            </>
          }
        />
      </SafeAreaView>
    );
  }
}

class Footer extends PureComponent<{
  isScanning: boolean,
  canRetry: boolean,
  canDone: boolean,
  onStop: () => void,
  onContinue: () => void,
  onRetry: () => void,
  onDone: () => void,
  isDisabled: boolean,
}> {
  render() {
    const {
      isDisabled,
      onContinue,
      isScanning,
      onStop,
      canRetry,
      canDone,
      onRetry,
      onDone,
    } = this.props;

    return (
      <View style={styles.footer}>
        {isScanning ? (
          <Button
            event="AddAccountsStopScan"
            type="tertiary"
            title={<Trans i18nKey="addAccounts.stopScanning" />}
            onPress={onStop}
            IconLeft={IconPause}
          />
        ) : canRetry ? (
          <Button
            event="AddAccountsRetryScan"
            type="primary"
            title={<Trans i18nKey="addAccounts.retryScanning" />}
            onPress={onRetry}
          />
        ) : canDone ? (
          <Button
            event="AddAccountsDone"
            type="primary"
            title={<Trans i18nKey="addAccounts.done" />}
            onPress={onDone}
          />
        ) : (
          <Button
            event="AddAccountsSelected"
            type="primary"
            title={<Trans i18nKey="addAccounts.finalCta" />}
            onPress={isDisabled ? undefined : onContinue}
          />
        )}
      </View>
    );
  }
}

class ScanLoading extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.scanLoadingRoot}>
        <Spinning>
          <LiveLogo color={colors.grey} size={16} />
        </Spinning>
        <LText semiBold style={styles.scanLoadingText}>
          <Trans i18nKey="addAccounts.synchronizing" />
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
  inner: {
    paddingTop: 24,
  },
  innerContent: {
    paddingBottom: 24,
  },
  descText: {
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: "center",
    color: colors.smoke,
  },
  scanLoadingRoot: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderWidth: 1,
    borderColor: colors.fog,
    borderStyle: "dashed",
    borderRadius: 4,
  },
  scanLoadingText: {
    fontSize: 14,
    color: colors.grey,
    marginLeft: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: colors.lightFog,
    padding: 16,
  },
  addAccountsError: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});

export default compose(
  translate(),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(AddAccountsAccounts);
