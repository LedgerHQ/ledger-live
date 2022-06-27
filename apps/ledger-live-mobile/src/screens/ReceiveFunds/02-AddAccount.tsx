import React, {
  PureComponent,
  useEffect,
  useCallback,
  useState,
  useRef,
  memo,
  useMemo,
} from "react";
import { StyleSheet, SafeAreaView, FlatList } from "react-native";
import { concat, from } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { connect, useDispatch } from "react-redux";
import { compose } from "redux";
import {
  isAccountEmpty,
  groupAddAccounts,
} from "@ledgerhq/live-common/lib/account";
import type { AddAccountSupportLink } from "@ledgerhq/live-common/lib/account/addAccounts";
import { createStructuredSelector } from "reselect";
import uniq from "lodash/uniq";
import { Trans, useTranslation } from "react-i18next";
import type { CryptoCurrency, Account, Currency, AccountLike } from "@ledgerhq/live-common/lib/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";

import type { DerivationMode } from "@ledgerhq/live-common/lib/derivation";

import { useTheme } from "@react-navigation/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
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
import AccountCard from "../../components/AccountCard";

type RouteParams = {
  currency: CryptoCurrency,
  device: Device,
  onSuccess?: (params?: any) => void,
};

type OwnProps = {};

type Props = {
  navigation: any;
  route: { params: RouteParams };
  blacklistedTokenIds?: string[];
  colors: any;
};



function AddAccountsAccounts({
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const {t} = useTranslation();

  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [scannedAccounts, setScannedAccounts] = useState([]);
  const [cancelled, setCancelled] = useState(false);

  const scanSubscription = useRef();

  const {
    currency,
    device: { deviceId },
    device
  } = route.params || {};

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, []);

  const startSubscription = useCallback(() => {
    const c = currency.type === "TokenCurrency"
      ? currency.parentCurrency
      : currency;
    const bridge = getCurrencyBridge(c);
    const syncConfig = {
      paginationConfig: {
        operation: 0,
      },
      blacklistedTokenIds: [],
    };
    // will be set to false if an existing account is found

    scanSubscription.current = concat(
      from(prepareCurrency(c)).pipe(ignoreElements()),
      bridge.scanAccounts({
        currency: c,
        deviceId,
        syncConfig,
      }),
    ).subscribe({
      next: ({ account }) => {
        setScannedAccounts((accs) => [...accs, account])
      },
      complete: () => setScanning(false),
      error: error => {
        logger.critical(error);
        setError(error);
      },
    });
  }, [currency, deviceId]);

  const restartSubscription = useCallback(() => {
    setScanning(true);
    setScannedAccounts([]);
    setError(null);
    setCancelled(false);
    startSubscription();
  }, []);

  const stopSubscription = useCallback((syncUI?: boolean = true) => {
    if (scanSubscription.current) {
      scanSubscription.current.unsubscribe();
      scanSubscription.current = null;
      if (syncUI) {
        setScanning(false);
      }
    }
  }, []);

  const onCancel = useCallback(() => {
    setError(null);
    setCancelled(true);
  }, []);

  const onModalHide = useCallback(() => {
    if (cancelled) {
      navigation.getParent().pop();
    }
  }, [cancelled, navigation]);

  const selectAccount = useCallback(
    (account: Account) => {
      dispatch(replaceAccounts({ scannedAccounts, selectedIds: [account.id], renamings: {}}));
      navigation.navigate(ScreenName.ReceiveConfirmation, {...route.params, accountId: account.id });
    },
    [dispatch, navigation, route.params, scannedAccounts],
  );

  const renderItem = useCallback(
    ({ item: account }: { item: Account }) => (
      <Flex px={6}>
        <AccountCard account={account} onPress={() => selectAccount(account)} />
      </Flex>
    ),
    [selectAccount],
  );

  const renderHeader = useCallback(() => 
    <Flex p={6}>
      <LText fontSize="32px" fontFamily="InterMedium" semiBold>{t("transfer.receive.selectAccount.title")}</LText>
      <LText variant="body" color="colore.neutral.70">{t("transfer.receive.selectAccount.subtitle", {currencyTicker: currency.ticker})}</LText>
    </Flex>
  , [currency.ticker, t])

  const keyExtractor = useCallback(item => item?.id, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="AddAccounts"
        name="Accounts"
        currencyName={currency.name}
      />
      <PreventNativeBack />
        {scanning ? <ScanLoading currency={currency} scannedAccounts={scannedAccounts} stopSubscription={stopSubscription} /> : (
            <FlatList
            data={scannedAccounts}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
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

function ScanLoading({ currency, scannedAccounts, stopSubscription }: {currency: Currency, scannedAccounts: Account[], stopSubscription: () => void}) {
  const { t } = useTranslation();
    return (
      <>
        <Flex flex={1} alignItems="center" justifyContent="center" m={6}>
          <InfiniteLoader size={48} />
          <LText mt={13} variant="h2">{t("transfer.receive.addAccount.title")}</LText>
          <LText p={6} textAlign="center" variant="body" color="neutral.c80">{t("transfer.receive.addAccount.subtitle", {currencyTicker: currency?.ticker})}</LText>
        </Flex>
        <Flex minHeight={120} flexDirection="column" alignItems="stretch" m={6} justifyContent="flex-end">
        {
          scannedAccounts?.length > 0 ? <>
          <LText textAlign="center" mb={6} variant="body" color="neutral.c80">{t("transfer.receive.addAccount.foundAccounts", {count: scannedAccounts?.length})}</LText>
          <Button type="secondary" onPress={stopSubscription}>{t("transfer.receive.addAccount.stopSynchronization")}</Button>
          </> : null 
        }
        </Flex>
      </>
    );
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
  smallMarginBottom: { marginBottom: 8 },
  moreAddressTypesContainer: { paddingHorizontal: 16, marginBottom: 32 },
  subtitle: { fontSize: 14 },
  title: { fontSize: 16 },
  modalTitle: { fontSize: 20 },
  modal: { paddingHorizontal: 24 },
  modalContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRow: { marginVertical: 16 },
});

export default AddAccountsAccounts;
