import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaView from "~/components/SafeAreaView";
import { Banner, Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { Check, Close, Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useTheme } from "styled-components/native";
import {
  useAleoViewKeyApproval,
  buildAccountsWithViewKeys,
} from "@ledgerhq/live-common/families/aleo/react";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { ScreenName } from "~/const";
import { Loading } from "~/components/Loading";
import Animation from "~/components/Animation";
import Button from "~/components/wrappedUi/Button";
import { DeviceActionDefaultRendering } from "~/components/DeviceAction";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { useAccountName } from "~/reducers/wallet";
import { useSelector, useDispatch } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import type { AleoViewKeyFlowParamList } from "./types";
import QuitConfirmationModal from "./QuitConfirmationModal";
import useQuitConfirmation from "./useQuitConfirmation";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyApprove>;

function AccountStatusLabel({
  account,
  fallbackLabel,
}: Readonly<{
  account: Account;
  fallbackLabel: string;
}>) {
  const accountName = useAccountName(account);
  return (
    <Text typography="body2" numberOfLines={1} style={styles.accountLabel} lx={{ color: "muted" }}>
      {accountName || fallbackLabel}
    </Text>
  );
}

export default function ViewKeyApproveScreen({ route, navigation }: Props) {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const existingAccounts = useSelector(accountsSelector);
  const abortedRef = useRef(false);
  const insets = useSafeAreaInsets();

  const {
    accountsToAdd: allAccountsToAdd,
    currency,
    device,
    onCloseNavigation,
    onSuccess,
    context,
  } = route.params;

  const cryptoCurrency =
    currency.type === "CryptoCurrency"
      ? currency
      : getCryptoCurrencyById(currency.parentCurrencyId);

  // Freeze the device-request list on mount: existingAccounts (a live Redux selector) can
  // get a new reference from background sync, and useAleoViewKeyApproval keys its device
  // transport subscription off selectedAccounts by reference, not content — recomputing it
  // mid-approval would tear down the subscription without restarting it.
  const [accountsToAdd] = useState(() => {
    const existingAddresses = new Set(existingAccounts.map(a => a.freshAddress));
    return allAccountsToAdd.filter(a => !existingAddresses.has(a.freshAddress));
  });

  const hasAccountsToAdd = accountsToAdd.length > 0;

  // getViewKeyExec requires at least one selected account, so if every incoming account
  // was already imported, keep the device action from starting by passing device: null.
  const { hookState, payload, request, confirmedAccountIds, rejectedAccountIds } =
    useAleoViewKeyApproval({
      device: hasAccountsToAdd ? device : null,
      selectedAccounts: accountsToAdd,
      currency: cryptoCurrency,
    });

  useEffect(() => {
    if (!hasAccountsToAdd) {
      onCloseNavigation?.();
    }
  }, [hasAccountsToAdd, onCloseNavigation]);

  const quitConfirmation = useQuitConfirmation({
    onCloseNavigation,
    onConfirm: useCallback(() => {
      abortedRef.current = true;
    }, []),
  });

  const onResult = useCallback(() => {
    if (abortedRef.current) return;
    if (!payload) return;
    const accountsWithViewKeys = buildAccountsWithViewKeys(accountsToAdd, payload);

    if (accountsWithViewKeys.length === 0) {
      abortedRef.current = true;
      const { accountsToAdd: _accountsToAdd, ...noAccountsAddedParams } = route.params;
      navigation.replace(ScreenName.AleoNoAccountsAdded, noAccountsAddedParams);
      return;
    }

    dispatch(
      addAccountsAction({
        existingAccounts,
        scannedAccounts: accountsWithViewKeys,
        selectedIds: accountsWithViewKeys.map(a => a.id),
        renamings: {},
      }),
    );

    onSuccess?.({
      scannedAccounts: accountsWithViewKeys,
      selected: accountsWithViewKeys,
    });

    // Deliberately omit onCloseNavigation here: it's this screen's own `handleClose`
    // (which pops the Aleo sub-navigator), and forwarding it would override
    // AddAccountsSuccess's own initialParams.onCloseNavigation, causing a duplicate
    // pop against an already-popped stack (see AddAccountNavigator.tsx handleClose).
    navigation.getParent()?.navigate(ScreenName.AddAccountsSuccess, {
      currency,
      accountsToAdd: accountsWithViewKeys,
      context,
    });
  }, [
    payload,
    accountsToAdd,
    existingAccounts,
    dispatch,
    navigation,
    route.params,
    currency,
    onSuccess,
    context,
  ]);

  const getAccountStatusIcon = useCallback(
    (index: number, accountId: string) => {
      if (index === hookState.shareProgress.completed && hookState.sharePending) {
        return <Spinner size={16} />;
      }
      if (confirmedAccountIds.has(accountId)) {
        return <Check size={16} color="muted" />;
      }
      if (rejectedAccountIds.has(accountId)) {
        return <Close size={16} color="muted" />;
      }
      return <Refresh size={16} color="muted" />;
    },
    [
      confirmedAccountIds,
      hookState.sharePending,
      hookState.shareProgress.completed,
      rejectedAccountIds,
    ],
  );

  const renderApprovalContent = () => {
    if (hookState.sharePending) {
      return (
        <Box style={[styles.overlay, { backgroundColor: colors.background.main }]}>
          <ScrollView style={styles.list} contentContainerStyle={styles.contentContainer}>
            <Box style={styles.animationContainer}>
              <Animation
                source={getDeviceAnimation({ modelId: device.modelId, key: "verify", theme })}
                style={getDeviceAnimationStyles(device.modelId)}
              />
            </Box>
            <Text typography="heading3SemiBold" style={styles.title} lx={{ color: "base" }}>
              <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.title" />
            </Text>
            <Text typography="body2" style={styles.description} lx={{ color: "base" }}>
              <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.description" />
            </Text>
            <Box style={styles.listContent}>
              {accountsToAdd.map((account, index) => (
                <Box
                  style={[styles.row, { backgroundColor: colors.opacityDefault.c05 }]}
                  key={account.id}
                >
                  <AccountStatusLabel account={account} fallbackLabel={account.freshAddress} />
                  <Box style={styles.statusIcon}>{getAccountStatusIcon(index, account.id)}</Box>
                </Box>
              ))}
            </Box>
            <Banner
              appearance="info"
              description={t("aleo.addAccount.stepViewKeyApprove.cancelAlert")}
            />
          </ScrollView>
          <Box style={[styles.footer, { bottom: insets.bottom + 24 }]}>
            <Button
              type="main"
              outline
              onPress={quitConfirmation.open}
              event="AleoAddAccountViewKeyApproveCancelAll"
            >
              {t("aleo.addAccount.stepViewKeyApprove.cancelAllBtn", {
                count: accountsToAdd.length,
              })}
            </Button>
          </Box>
        </Box>
      );
    }

    if (payload === null) {
      return null;
    }

    return <Loading />;
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      testID="aleo-view-key-approve-screen"
      style={[styles.root, { backgroundColor: colors.background.main }]}
    >
      <TrackScreen category="AleoAddAccountFlow" name="View key approve" />
      <DeviceActionDefaultRendering
        status={hookState}
        request={request}
        payload={payload}
        device={device}
        onResult={onResult}
      />
      {renderApprovalContent()}
      <QuitConfirmationModal
        isOpened={quitConfirmation.isOpened}
        onClose={quitConfirmation.close}
        onConfirm={quitConfirmation.confirm}
        onModalHide={quitConfirmation.onModalHide}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 128,
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    rowGap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  accountLabel: {
    flex: 1,
    marginRight: 12,
  },
  statusIcon: {
    width: 20,
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
