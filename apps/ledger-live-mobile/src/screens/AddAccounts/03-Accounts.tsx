import React, {
  PureComponent,
  useEffect,
  useCallback,
  useState,
  useRef,
  memo,
  useMemo,
} from "react";
import { StyleSheet, View, Linking, SafeAreaView } from "react-native";
import { concat, from } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { connect } from "react-redux";
import { compose } from "redux";
import {
  isAccountEmpty,
  groupAddAccounts,
} from "@ledgerhq/live-common/account/index";
import type { AddAccountSupportLink } from "@ledgerhq/live-common/account/addAccounts";
import { createStructuredSelector } from "reselect";
import uniq from "lodash/uniq";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import type { DerivationMode } from "@ledgerhq/live-common/derivation";
import { useTheme } from "@react-navigation/native";
import { replaceAccounts } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";
import logger from "../../logger";
import { withTheme } from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import PreventNativeBack from "../../components/PreventNativeBack";
import SelectableAccountsList from "../../components/SelectableAccountsList";
import LiveLogo from "../../icons/LiveLogoIcon";
import IconPause from "../../icons/Pause";
import ExternalLink from "../../icons/ExternalLink";
import Chevron from "../../icons/Chevron";
import Info from "../../icons/Info";
import Spinning from "../../components/Spinning";
import LText from "../../components/LText";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import { prepareCurrency } from "../../bridge/cache";
import { blacklistedTokenIdsSelector } from "../../reducers/settings";
import BottomModal from "../../components/BottomModal";
import { urls } from "../../config/urls";
import noAssociatedAccountsByFamily from "../../generated/NoAssociatedAccounts";

const SectionAccounts = ({ defaultSelected, ...rest }: any) => {
  useEffect(() => {
    if (defaultSelected && rest.onSelectAll) {
      rest.onSelectAll(rest.accounts);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <SelectableAccountsList useFullBalance {...rest} />;
};

type RouteParams = {
  currency: CryptoCurrency | TokenCurrency;
  device: Device;
  inline?: boolean;
  returnToSwap?: boolean;
  onSuccess?: (_?: any) => void;
};
// eslint-disable-next-line @typescript-eslint/ban-types
type OwnProps = {};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
  replaceAccounts: (_: {
    scannedAccounts: Account[];
    selectedIds: string[];
    renamings: Record<string, string>;
  }) => void;
  existingAccounts: Account[];
  blacklistedTokenIds?: string[];
  colors: any;
};
const mapStateToProps = createStructuredSelector({
  existingAccounts: accountsSelector,
  blacklistedTokenIds: blacklistedTokenIdsSelector,
});
const mapDispatchToProps = {
  replaceAccounts,
};

function AddAccountsAccounts({
  navigation,
  route,
  replaceAccounts,
  existingAccounts,
  blacklistedTokenIds,
}: Props) {
  const { colors } = useTheme();
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [latestScannedAccount, setLatestScannedAccount] = useState(null);
  const [scannedAccounts, setScannedAccounts] = useState([]);
  const [onlyNewAccounts, setOnlyNewAccounts] = useState(true);
  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const scanSubscription = useRef();
  const scrollView = useRef();
  const {
    currency,
    device: { deviceId },
    inline,
    returnToSwap,
  } = route.params || {};
  // Find accounts that are (scanned && !existing && !used)
  const newAccountSchemes = scannedAccounts
    .filter(
      a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used,
    )
    .map(a => a.derivationMode);
  const preferredNewAccountScheme = useMemo(
    () =>
      newAccountSchemes && newAccountSchemes.length > 0
        ? newAccountSchemes[0]
        : undefined,
    [newAccountSchemes],
  );
  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, []);
  useEffect(() => {
    if (latestScannedAccount) {
      const hasAlreadyBeenScanned = scannedAccounts.some(
        a => latestScannedAccount.id === a.id,
      );
      const hasAlreadyBeenImported = existingAccounts.some(
        a => latestScannedAccount.id === a.id,
      );
      const isNewAccount = isAccountEmpty(latestScannedAccount);

      if (!isNewAccount && !hasAlreadyBeenImported) {
        setOnlyNewAccounts(false);
      }

      if (!hasAlreadyBeenScanned) {
        setScannedAccounts([...scannedAccounts, latestScannedAccount]);
        setSelectedIds(
          onlyNewAccounts
            ? hasAlreadyBeenImported || selectedIds.length > 0
              ? selectedIds
              : [latestScannedAccount.id]
            : !hasAlreadyBeenImported && !isNewAccount
            ? uniq([...selectedIds, latestScannedAccount.id])
            : selectedIds,
        );
      }
    }
  }, [latestScannedAccount]);
  // workarround to apply changes of subscription with current react state -> only react to this variable
  const handleContentSizeChange = useCallback(() => {
    if (scrollView.current) {
      scrollView.current.scrollToEnd({
        animated: true,
      });
    }
  }, []);
  const startSubscription = useCallback(() => {
    const cryptoCurrency = isTokenCurrency(currency)
      ? currency.parentCurrency
      : currency;
    const bridge = getCurrencyBridge(cryptoCurrency);
    const syncConfig = {
      paginationConfig: {
        operation: 0,
      },
      blacklistedTokenIds,
    };
    // will be set to false if an existing account is found
    scanSubscription.current = concat(
      from(prepareCurrency(cryptoCurrency)).pipe(ignoreElements()),
      bridge.scanAccounts({
        currency: cryptoCurrency,
        deviceId,
        syncConfig,
      }),
    ).subscribe({
      next: ({ account }) => {
        setLatestScannedAccount(account);
      },
      complete: () => setScanning(false),
      error: error => {
        logger.critical(error);
        setError(error);
      },
    });
  }, [blacklistedTokenIds, currency, deviceId]);
  const restartSubscription = useCallback(() => {
    setScanning(true);
    setScannedAccounts([]);
    setSelectedIds([]);
    setError(null);
    setCancelled(false);
    startSubscription();
  }, []);
  const stopSubscription = useCallback((syncUI = true) => {
    if (scanSubscription.current) {
      scanSubscription.current.unsubscribe();
      scanSubscription.current = null;

      if (syncUI) {
        setScanning(false);
      }
    }
  }, []);
  const quitFlow = useCallback(() => {
    navigation.navigate(ScreenName.Accounts);
  }, [navigation]);
  const onPressAccount = useCallback(
    (account: Account) => {
      const isChecked = selectedIds.indexOf(account.id) > -1;
      const newSelectedIds = isChecked
        ? selectedIds.filter(id => id !== account.id)
        : [...selectedIds, account.id];
      setSelectedIds(newSelectedIds);
    },
    [selectedIds],
  );
  const selectAll = useCallback(
    (accounts: Account[]) => {
      setSelectedIds(uniq([...selectedIds, ...accounts.map(a => a.id)]));
    },
    [selectedIds],
  );
  const unselectAll = useCallback(
    (accounts: Account[]) => {
      setSelectedIds(
        selectedIds.filter(id => !accounts.find(a => a.id === id)),
      );
    },
    [selectedIds],
  );
  const importAccount = useCallback(() => {
    replaceAccounts({
      scannedAccounts,
      selectedIds,
      renamings: {}, // renaming was done in scannedAccounts directly.. (see if we want later to change this paradigm)
    });

    if (inline) {
      navigation.goBack();
    } else if (navigation.replace) {
      const { onSuccess } = route.params;
      if (onSuccess)
        onSuccess({
          scannedAccounts,
        });
      else
        navigation.replace(ScreenName.AddAccountsSuccess, {
          ...route.params,
          currency,
        });
    }
  }, [
    currency,
    inline,
    navigation,
    replaceAccounts,
    route.params,
    scannedAccounts,
    selectedIds,
  ]);
  const onCancel = useCallback(() => {
    setError(null);
    setCancelled(true);
  }, []);
  const onModalHide = useCallback(() => {
    if (cancelled) {
      navigation.getParent().pop();
    }
  }, [cancelled, navigation]);
  const viewAllCreatedAccounts = useCallback(
    () => setShowAllCreatedAccounts(true),
    [],
  );
  const onAccountNameChange = useCallback(
    (name: string, changedAccount: Account) => {
      setScannedAccounts(
        scannedAccounts.map(account =>
          account.id === changedAccount.id ? { ...account, name } : account,
        ),
      );
    },
    [scannedAccounts],
  );
  const { sections, alreadyEmptyAccount } = useMemo(
    () =>
      groupAddAccounts(existingAccounts, scannedAccounts, {
        scanning,
        preferredNewAccountSchemes: showAllCreatedAccounts
          ? undefined
          : [preferredNewAccountScheme],
      }),
    [
      existingAccounts,
      scannedAccounts,
      scanning,
      showAllCreatedAccounts,
      preferredNewAccountScheme,
    ],
  );
  const cantCreateAccount = !sections.some(s => s.id === "creatable");
  const noImportableAccounts = !sections.some(
    s => s.id === "importable" || s.id === "creatable" || s.id === "migrate",
  );
  const CustomNoAssociatedAccounts =
    noAssociatedAccountsByFamily[currency.family];
  const emptyTexts = {
    creatable: alreadyEmptyAccount ? (
      <LText style={styles.paddingHorizontal}>
        <Trans i18nKey="addAccounts.cantCreateAccount">
          {"PLACEHOLDER-1"}
          <LText semiBold>{alreadyEmptyAccount.name}</LText>
          {"PLACEHOLDER-2"}
        </Trans>
      </LText>
    ) : CustomNoAssociatedAccounts ? (
      <CustomNoAssociatedAccounts style={styles} />
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
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="AddAccounts"
        name="Accounts"
        currencyName={currency.name}
      />
      <PreventNativeBack />
      <NavigationScrollView
        style={styles.inner}
        contentContainerStyle={styles.innerContent} // $FlowFixMe
        ref={scrollView}
        onContentSizeChange={handleContentSizeChange}
      >
        {sections.map(({ id, selectable, defaultSelected, data }, i) => {
          const hasMultipleSchemes =
            id === "creatable" &&
            newAccountSchemes &&
            newAccountSchemes.length > 1 &&
            data.length > 0 &&
            !scanning;
          return (
            <View key={id}>
              <SectionAccounts
                defaultSelected={defaultSelected}
                key={id}
                showHint={selectable && i === 0}
                header={
                  <Trans
                    values={{
                      length: data.length,
                    }}
                    i18nKey={`addAccounts.sections.${id}.title`}
                  />
                }
                index={i}
                accounts={data}
                onAccountNameChange={
                  !selectable ? undefined : onAccountNameChange
                }
                onPressAccount={!selectable ? undefined : onPressAccount}
                onSelectAll={
                  !selectable || id === "creatable" ? undefined : selectAll
                }
                onUnselectAll={!selectable ? undefined : unselectAll}
                selectedIds={selectedIds}
                emptyState={emptyTexts[id]}
                isDisabled={!selectable}
                forceSelected={id === "existing"}
                style={hasMultipleSchemes ? styles.smallMarginBottom : {}}
              />
              {hasMultipleSchemes ? (
                <View style={styles.moreAddressTypesContainer}>
                  {showAllCreatedAccounts ? (
                    <AddressTypeTooltip
                      accountSchemes={newAccountSchemes}
                      currency={currency}
                    />
                  ) : (
                    <Button
                      event={"AddAccountsMoreAddressType"}
                      type="secondary"
                      title={<Trans i18nKey="addAccounts.showMoreChainType" />}
                      titleStyle={styles.subtitle}
                      onPress={viewAllCreatedAccounts}
                      IconRight={Chevron}
                    />
                  )}
                </View>
              ) : null}
            </View>
          );
        })}

        {sections.length === 0 && scanning ? (
          <LText style={styles.descText} color="smoke">
            <Trans i18nKey="addAccounts.synchronizingDesc" />
          </LText>
        ) : null}
        {scanning ? <ScanLoading colors={colors} /> : null}
      </NavigationScrollView>
      {!!scannedAccounts.length && (
        <Footer
          isScanning={scanning}
          canRetry={!scanning && noImportableAccounts && !cantCreateAccount}
          canDone={!scanning && cantCreateAccount && noImportableAccounts}
          onRetry={restartSubscription}
          onStop={stopSubscription}
          onDone={quitFlow}
          onContinue={importAccount}
          isDisabled={selectedIds.length === 0}
          colors={colors}
          returnToSwap={returnToSwap}
        />
      )}
      <GenericErrorBottomModal
        error={error}
        onModalHide={onModalHide}
        footerButtons={
          <>
            <CancelButton containerStyle={styles.button} onPress={onCancel} />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={restartSubscription}
            />
          </>
        }
      />
    </SafeAreaView>
  );
}

const AddressTypeTooltip = ({
  accountSchemes,
  currency,
}: {
  accountSchemes: Array<DerivationMode> | null | undefined;
  currency: CryptoCurrency;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);
  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  const formattedAccountSchemes = accountSchemes
    ? accountSchemes.map(a => (a === "" ? "legacy" : a))
    : [];
  return (
    <>
      <Button
        event={"AddAccountsAddressTypeTooltip"}
        type="lightSecondary"
        title={<Trans i18nKey="addAccounts.addressTypeInfo.title" />}
        titleStyle={styles.subtitle}
        onPress={onOpen}
        IconRight={Info}
      />
      <BottomModal isOpened={isOpen} onClose={onClose} style={styles.modal}>
        <View style={styles.modalContainer}>
          <LText style={styles.subtitle} color="grey">
            <Trans i18nKey="addAccounts.addressTypeInfo.subtitle" />
          </LText>
          <LText bold style={styles.modalTitle}>
            <Trans i18nKey="addAccounts.addressTypeInfo.title" />
          </LText>
        </View>

        {formattedAccountSchemes.map((scheme, i) => (
          <View key={i + scheme} style={styles.modalRow}>
            <LText bold style={styles.title}>
              <Trans i18nKey={`addAccounts.addressTypeInfo.${scheme}.title`} />
            </LText>
            <LText style={styles.subtitle} color="grey">
              <Trans
                i18nKey={`addAccounts.addressTypeInfo.${scheme}.desc`}
                values={{
                  currency: currency.name,
                }}
              />
            </LText>
          </View>
        ))}
        {currency && currency.family === "bitcoin" ? (
          <Button
            event={"AddAccountsSupportLink_AddressType"}
            type="lightSecondary"
            title={<Trans i18nKey={`common.learnMore`} />}
            IconLeft={ExternalLink}
            onPress={() => Linking.openURL(urls.bitcoinAddressType)}
          />
        ) : null}
      </BottomModal>
    </>
  );
};

class Footer extends PureComponent<{
  isScanning: boolean;
  canRetry: boolean;
  canDone: boolean;
  onStop: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onDone: () => void;
  isDisabled: boolean;
  supportLink?: AddAccountSupportLink;
  colors: any;
  returnToSwap?: boolean;
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
      colors,
      returnToSwap,
    } = this.props;
    return (
      <View
        style={[
          styles.footer,
          {
            borderColor: colors.lightFog,
          },
        ]}
      >
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
            title={
              returnToSwap ? (
                <Trans i18nKey="addAccounts.finalCtaForSwap" />
              ) : (
                <Trans i18nKey="addAccounts.finalCta" />
              )
            }
            onPress={isDisabled ? undefined : onContinue}
          />
        )}
      </View>
    );
  }
}

class ScanLoading extends PureComponent<{
  colors: any;
}> {
  render() {
    const { colors } = this.props;
    return (
      <View
        style={[
          styles.scanLoadingRoot,
          {
            borderColor: colors.fog,
          },
        ]}
      >
        <Spinning>
          <LiveLogo color={colors.grey} size={16} />
        </Spinning>
        <LText semiBold style={styles.scanLoadingText} color="grey">
          <Trans i18nKey="addAccounts.synchronizing" />
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  },
  scanLoadingRoot: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 4,
  },
  scanLoadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  footer: {
    borderTopWidth: 1,
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
  smallMarginBottom: {
    marginBottom: 8,
  },
  moreAddressTypesContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
  },
  title: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
  },
  modal: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRow: {
    marginVertical: 16,
  },
});
const m: React.ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTheme,
)(memo<Props>(AddAccountsAccounts));
export default m;
