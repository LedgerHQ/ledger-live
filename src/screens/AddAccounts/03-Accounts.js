// @flow

import React, { PureComponent, createRef, useEffect } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import i18next from "i18next";
import {
  isAccountEmpty,
  groupAddAccounts,
} from "@ledgerhq/live-common/lib/account";
import { createStructuredSelector } from "reselect";
import uniq from "lodash/uniq";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import { replaceAccounts } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import logger from "../../logger";
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

const forceInset = { bottom: "always" };

const SectionAccounts = ({ defaultSelected, ...rest }: *) => {
  useEffect(() => {
    if (defaultSelected && rest.onSelectAll) {
      rest.onSelectAll(rest.accounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <SelectableAccountsList {...rest} />;
};

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
      deviceId: string,
    },
  }>,
  replaceAccounts: ({
    scannedAccounts: Account[],
    selectedIds: string[],
    renamings: { [id: string]: string },
  }) => void,
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
  replaceAccounts,
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
        next: ({ account }) =>
          this.setState(
            ({ scannedAccounts, selectedIds }, { existingAccounts }) => {
              const hasAlreadyBeenScanned = !!scannedAccounts.find(
                a => account.id === a.id,
              );
              const hasAlreadyBeenImported = !!existingAccounts.find(
                a => account.id === a.id,
              );
              const isNewAccount = isAccountEmpty(account);
              if (!hasAlreadyBeenScanned) {
                return {
                  scannedAccounts: [...scannedAccounts, account],
                  selectedIds:
                    !hasAlreadyBeenImported && !isNewAccount
                      ? uniq([...selectedIds, account.id])
                      : selectedIds,
                };
              }
              return null;
            },
          ),
        complete: () => this.setState({ scanning: false }),
        error: error => {
          logger.critical(error)
          this.setState({ error })},
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
    const { replaceAccounts, navigation } = this.props;
    const { scannedAccounts, selectedIds } = this.state;
    const currency = navigation.getParam("currency");
    replaceAccounts({
      scannedAccounts,
      selectedIds,
      renamings: {}, // renaming was done in scannedAccounts directly.. (see if we want later to change this paradigm)
    });
    if (navigation.replace) {
      navigation.replace("AddAccountsSuccess", { currency });
    }
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
    const { existingAccounts, navigation } = this.props;
    const currency = navigation.getParam("currency");
    const { selectedIds, scanning, scannedAccounts, error } = this.state;

    const { sections, alreadyEmptyAccount } = groupAddAccounts(
      existingAccounts,
      scannedAccounts,
      {
        scanning,
      },
    );

    const cantCreateAccount = !sections.some(s => s.id === "creatable");
    const noImportableAccounts = !sections.some(
      s => s.id === "importable" || s.id === "creatable" || s.id === "migrate",
    );

    const emptyTexts = {
      creatable: alreadyEmptyAccount ? (
        <LText style={styles.paddingHorizontal}>
          <Trans i18nKey="addAccounts.cantCreateAccount">
            {"PLACEHOLDER-1"}
            <LText semiBold>{alreadyEmptyAccount.name}</LText>
            {"PLACEHOLDER-2"}
          </Trans>
        </LText>
      ) : (
        <LText style={styles.paddingHorizontal}>
          <Trans i18nKey="addAccounts.noAccountToCreate">
            {"PLACEHOLDER-1"}
            <LText semiBold>{currency.name}</LText>
            {"PLACEHOLDER-2"}
          </Trans>
        </LText>
      ),
    };

    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <TrackScreen category="AddAccounts" name="Accounts" />
        <PreventNativeBack />
        <ScrollView
          style={styles.inner}
          contentContainerStyle={styles.innerContent}
          ref={this.scrollView}
          onContentSizeChange={this.handleContentSizeChange}
        >
          {sections.map(({ id, selectable, defaultSelected, data }, i) => (
            <SectionAccounts
              defaultSelected={defaultSelected}
              key={id}
              showHint={selectable && i === 0}
              header={
                <Trans
                  values={{ length: data.length }}
                  i18nKey={`addAccounts.sections.${id}.title`}
                />
              }
              index={i}
              accounts={data}
              onAccountNameChange={
                !selectable ? undefined : this.onAccountNameChange
              }
              onPressAccount={!selectable ? undefined : this.onPressAccount}
              onSelectAll={!selectable ? undefined : this.selectAll}
              onUnselectAll={!selectable ? undefined : this.unselectAll}
              selectedIds={selectedIds}
              emptyState={emptyTexts[id]}
              isDisabled={!selectable}
              forceSelected={id === "existing"}
            />
          ))}

          {sections.length === 0 && scanning ? (
            <LText style={styles.descText}>
              <Trans i18nKey="addAccounts.synchronizingDesc" />
            </LText>
          ) : null}

          {scanning ? <ScanLoading /> : null}
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
