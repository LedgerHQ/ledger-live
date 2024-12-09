import React, { useEffect, useCallback, useState, useRef, memo } from "react";
import { FlatList } from "react-native";
import { concat, from } from "rxjs";
import type { Subscription } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";

import { Flex, Text } from "@ledgerhq/native-ui";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";

import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import PreventNativeBack from "~/components/PreventNativeBack";
import LText from "~/components/LText";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { prepareCurrency } from "~/bridge/cache";
import AccountCard from "~/components/AccountCard";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import Animation from "~/components/Animation";
import lottie from "~/screens/ReceiveFunds/assets/lottie.json";
import GradientContainer from "~/components/GradientContainer";
import { useTheme } from "styled-components/native";
import { walletSelector } from "~/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { accountsSelector } from "~/reducers/accounts";
import logger from "~/logger";
import { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";

type Props = StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.ScanDeviceAccounts>;

function ScanDeviceAccounts({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [scanning, setScanning] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [error, setError] = useState(null);
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [cancelled, setCancelled] = useState(false);

  const existingAccounts = useSelector(accountsSelector);
  const scanSubscription = useRef<Subscription | null>();

  const {
    currency,
    device: { deviceId },
  } = route.params || {};

  const selectAccount = useCallback(
    (account: Account, currentScannedAccounts: Account[], addingAccountDelayMs?: number) => {
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: currentScannedAccounts,
          selectedIds: [account.id],
          renamings: {},
        }),
      );
      if (addingAccountDelayMs) {
        setTimeout(() => {
          setAddingAccount(false);
          // TODO: navigate to next screen to be done in the next feature
        }, addingAccountDelayMs);
      } else {
        // TODO: navigate to next screen to be done in the next feature
      }
    },
    //[dispatch, navigation, route.params, existingAccounts],
    [dispatch, existingAccounts],
  );

  const startSubscription = useCallback(() => {
    const c = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
    const bridge = getCurrencyBridge(c);
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds: [],
    };
    // will be set to false if an existing account is found
    // @TODO observable similar to the one in AddAccounts Flow maybe refactor both in single workflow
    scanSubscription.current = concat(
      from(prepareCurrency(c)).pipe(ignoreElements()),
      bridge.scanAccounts({
        currency: c,
        deviceId,
        syncConfig,
      }),
    ).subscribe({
      next: ({ account }: { account: Account }) => {
        if (currency.type === "TokenCurrency") {
          // handle token accounts cases where we want to create empty new token accounts
          const pa = { ...account };

          if (
            !pa.subAccounts ||
            !pa.subAccounts.find(a => (a as TokenAccount)?.token?.id === currency.id) // in case we dont already have one we create an empty token account
          ) {
            const tokenAcc = makeEmptyTokenAccount(pa, currency);
            const tokenA = {
              ...tokenAcc,
              parentAccount: pa,
            };

            pa.subAccounts = [...(pa.subAccounts || []), tokenA];
          }

          setScannedAccounts((accs: Account[]) => [...accs, pa]); // add the account with the newly added token account to the list of scanned accounts
        } else {
          setScannedAccounts((accs: Account[]) => [...accs, account]); // add the account to the list of scanned accounts
        }
      },
      complete: () => {
        setScanning(false);
        setScannedAccounts(prevScannedAccounts => {
          if (prevScannedAccounts.length === 1) {
            setAddingAccount(true);
            selectAccount(prevScannedAccounts[0], prevScannedAccounts, 4000);
          }
          return prevScannedAccounts;
        });
      },
      error: error => {
        logger.critical(error);
        setError(error);
      },
    });
  }, [currency, deviceId, selectAccount]);

  const restartSubscription = useCallback(() => {
    setScanning(true);
    setScannedAccounts([]);
    setError(null);
    setCancelled(false);
    startSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onCancel = useCallback(() => {
    setError(null);
    setCancelled(true);
  }, []);

  const onModalHide = useCallback(() => {
    if (cancelled) {
      navigation.getParent<StackNavigatorNavigation<RootStackParamList>>()?.pop();
    }
  }, [cancelled, navigation]);

  const walletState = useSelector(walletSelector);

  const renderItem = useCallback(
    ({ item: account }: { item: Account }) => {
      const acc =
        currency.type === "TokenCurrency"
          ? account.subAccounts?.find(a => (a as TokenAccount).token.id === currency.id)
          : account;

      return acc ? (
        <Flex px={6}>
          <AccountCard
            account={acc}
            onPress={() => selectAccount(account, scannedAccounts)}
            AccountSubTitle={
              currency.type === "TokenCurrency" ? (
                <LText color="neutral.c70">
                  {accountNameWithDefaultSelector(walletState, account)}
                </LText>
              ) : null
            }
          />
        </Flex>
      ) : null;
    },
    [currency.id, currency.type, scannedAccounts, selectAccount, walletState],
  );

  const renderHeader = useCallback(
    () => (
      <Flex p={6}>
        <LText fontSize="32px" fontFamily="InterMedium" semiBold>
          {t("transfer.receive.selectAccount.title")}
        </LText>
        <LText variant="body" color="neutral.c70">
          {t("transfer.receive.selectAccount.subtitle", {
            currencyTicker: currency.ticker,
          })}
        </LText>
      </Flex>
    ),
    [currency.ticker, t],
  );

  const keyExtractor = useCallback((item: Account) => item?.id, []);

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  return (
    <>
      <TrackScreen category="Deposit" name="Accounts" asset={currency.name} />
      <PreventNativeBack />
      {scanning ? (
        <ScanLoading
          currency={currency}
          scannedAccounts={scannedAccounts}
          stopSubscription={stopSubscription}
        />
      ) : addingAccount ? (
        <AddingAccountLoading currency={currency} />
      ) : (
        <>
          <TrackScreen
            category="Deposit"
            name="Select account to deposit to"
            asset={currency.name}
          />
          <FlatList
            data={scannedAccounts}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
      <GenericErrorBottomModal
        error={error}
        onModalHide={onModalHide}
        footerButtons={
          <>
            <CancelButton flex={1} mx={8} onPress={onCancel} />
            <RetryButton flex={1} mx={8} onPress={restartSubscription} />
          </>
        }
      />
    </>
  );
}

function ScanLoading({
  currency,
  scannedAccounts,
  stopSubscription,
}: {
  currency: Currency;
  scannedAccounts: Account[];
  stopSubscription: () => void;
}) {
  const { t } = useTranslation();
  const numberOfAccountsFound = scannedAccounts?.length;

  return (
    <Loading
      title={t("transfer.receive.addAccount.subtitle", {
        currencyName: currency.name,
      })}
    >
      <TrackScreen category="Deposit" name="Create account" asset={currency.name} />
      <Flex
        minHeight={120}
        flexDirection="column"
        alignItems="stretch"
        p={6}
        position="absolute"
        bottom={0}
        left={0}
        width="100%"
      >
        <Flex
          minHeight={120}
          flexDirection="column"
          alignItems="stretch"
          m={6}
          justifyContent="flex-end"
        >
          {numberOfAccountsFound > 0 ? (
            <>
              <LText textAlign="center" mb={6} variant="body" color="neutral.c80">
                {t("transfer.receive.addAccount.foundAccount", {
                  count: numberOfAccountsFound,
                })}
              </LText>
              <Button type="secondary" onPress={stopSubscription}>
                {t("transfer.receive.addAccount.stopSynchronization")}
              </Button>
            </>
          ) : null}
        </Flex>
      </Flex>
    </Loading>
  );
}

function AddingAccountLoading({ currency }: { currency: Currency }) {
  const { t } = useTranslation();

  return (
    <Loading
      title={t("transfer.receive.addAccount.addingAccount", { currencyName: currency.name })}
    />
  );
}

function Loading({
  children,
  title,
  subtitle,
}: {
  children?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();

  return (
    <>
      <GradientContainer
        color={colors.background.main}
        startOpacity={1}
        endOpacity={0}
        containerStyle={{ borderRadius: 0, position: "absolute", bottom: 0, left: 0 }}
        gradientStyle={{ zIndex: 1 }}
      >
        <Animation style={{ width: "100%" }} source={lottie} />
      </GradientContainer>
      <Flex flex={1} position="relative">
        <Flex flex={1} alignItems="center" justifyContent="center" m={6}>
          <Text variant="h4" fontWeight="semiBold" textAlign="center">
            {title}
          </Text>
          <Text mt={6} textAlign="center" variant="body" fontWeight="medium" color="neutral.c80">
            {subtitle}
          </Text>
        </Flex>
        {children}
      </Flex>
    </>
  );
}

export default memo(ScanDeviceAccounts);
