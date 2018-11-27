// @flow

import React, { PureComponent, createRef } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";
import { createStructuredSelector } from "reselect";
import uniq from "lodash/uniq";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import { addAccount } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import { getCurrencyBridge } from "../../bridge";
import Button from "../../components/Button";
import PreventNativeBack from "../../components/PreventNativeBack";
import StepHeader from "../../components/StepHeader";
import SelectableAccountsList from "../../components/SelectableAccountsList";
import LiveLogo from "../../icons/LiveLogoIcon";
import IconPause from "../../icons/Pause";
import Spinning from "../../components/Spinning";
import LText from "../../components/LText";
import AddAccountsError from "./AddAccountsError";

import colors from "../../colors";

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

type Status = "idle" | "scanning" | "error";

type State = {
  status: Status,
  error: ?Error,
  scannedAccounts: Account[],
  selectedIds: string[],
};

const mapStateToProps = createStructuredSelector({
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  addAccount,
};

class AddAccountsAccounts extends PureComponent<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Accounts" subtitle="step 3 of 3" />,
    gesturesEnabled: false,
  };

  state = {
    // we assume status is scanning at beginning bcause we start sync at mount
    status: "scanning",
    error: null,
    scannedAccounts: [],
    selectedIds: [],
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
        complete: () => this.setState({ status: "idle" }),
        error: error => this.setState({ status: "error", error }),
      });
  };

  restartSubscription = () => {
    this.setState({
      status: "scanning",
      scannedAccounts: [],
      selectedIds: [],
      error: null,
    });
    this.startSubscription();
  };

  stopSubscription = (syncUI = true) => {
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
      this.scanSubscription = null;
      if (syncUI) {
        this.setState({ status: "idle" });
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
      <LText>
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
      <LText>
        <Trans i18nKey="addAccounts.cantCreateAccount">
          {"PLACEHOLDER-1"}
          <LText semiBold>{correspondingAccount.name}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    );
  };

  scrollView = createRef();

  render() {
    const { selectedIds, status, scannedAccounts, error } = this.state;
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
        <PreventNativeBack />
        <ScrollView
          style={styles.inner}
          contentContainerStyle={styles.innerContent}
          ref={this.scrollView}
          onContentSizeChange={this.handleContentSizeChange}
        >
          {regularAccounts.length > 0 ? (
            <SelectableAccountsList
              header={<Trans i18nKey="addAccounts.sections.accountsToImport" />}
              accounts={regularAccounts}
              onPressAccount={this.onPressAccount}
              onSelectAll={this.selectAll}
              onUnselectAll={this.unselectAll}
              selectedIds={selectedIds}
            />
          ) : status === "scanning" ? (
            <LText style={styles.descText}>
              <Trans i18nKey="addAccounts.synchronizingDesc" />
            </LText>
          ) : null}
          {status === "scanning" && <ScanLoading />}
          {status === "error" &&
            error && (
              <AddAccountsError
                error={error}
                style={styles.addAccountsError}
                onRetry={this.restartSubscription}
              />
            )}
          {(newAccounts.length > 0 || status === "idle") && (
            <SelectableAccountsList
              header={<Trans i18nKey="addAccounts.sections.addNewAccount" />}
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
              accounts={existingAccountsFiltered}
              forceSelected
              isDisabled
            />
          )}
        </ScrollView>
        {!!scannedAccounts.length && (
          <Footer
            isScanning={status === "scanning"}
            canRetry={
              status !== "scanning" &&
              noImportableAccounts &&
              !cantCreateAccount
            }
            canDone={
              status !== "scanning" && cantCreateAccount && noImportableAccounts
            }
            onRetry={this.restartSubscription}
            onStop={this.stopSubscription}
            onDone={this.quitFlow}
            onContinue={this.import}
            isDisabled={selectedIds.length === 0}
          />
        )}
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
            type="tertiary"
            title={<Trans i18nKey="addAccounts.stopScanning" />}
            onPress={onStop}
            IconLeft={IconPause}
          />
        ) : canRetry ? (
          <Button
            type="primary"
            title={<Trans i18nKey="addAccounts.retryScanning" />}
            onPress={onRetry}
          />
        ) : canDone ? (
          <Button
            type="primary"
            title={<Trans i18nKey="addAccounts.done" />}
            onPress={onDone}
          />
        ) : (
          <Button
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
});

export default compose(
  translate(),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(AddAccountsAccounts);
