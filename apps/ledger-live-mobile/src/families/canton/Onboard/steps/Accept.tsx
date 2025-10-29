import React, { useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import { Flex, Text, Button, Checkbox, IconBox, Alert } from "@ledgerhq/native-ui";
import LedgerIcon from "~/icons/Ledger";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CantonOnboardAccountParamList } from "../types";
import { take, filter } from "rxjs/operators";
import { ScreenName, NavigatorName } from "~/const";
import SelectableAccountsList from "~/components/SelectableAccountsList";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { useLocalizedUrl } from "~/newArch/hooks/useLocalizedUrls";
import type {
  CantonCurrencyBridge,
  CantonOnboardResult,
  CantonOnboardProgress,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
} from "@ledgerhq/coin-canton/types";
import { urls } from "~/utils/urls";
import { Subscription } from "rxjs";
import styled from "styled-components/native";
import { TouchableOpacity, Linking } from "react-native";
import DeviceActionModal from "~/components/DeviceActionModal";
import { accountsSelector } from "~/reducers/accounts";

const LinkTouchable = styled(TouchableOpacity).attrs({
  activeOpacity: 0.5,
})`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

export const LearnMore = (): JSX.Element => {
  const link = useLocalizedUrl(urls.canton.learnMore);
  return (
    <LinkTouchable onPress={() => Linking.openURL(link)}>
      <Alert.UnderlinedText mr="5px">
        <Trans i18nKey="common.learnMore" />
      </Alert.UnderlinedText>
    </LinkTouchable>
  );
};

// Type guard function to distinguish between CantonOnboardProgress and CantonOnboardResult
function isCantonOnboardResult(
  value: CantonOnboardProgress | CantonOnboardResult,
): value is CantonOnboardResult {
  return "partyId" in value;
}

// Type guard function to distinguish between CantonAuthorizeProgress and CantonAuthorizeResult
function isCantonAuthorizeResult(
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): value is CantonAuthorizeResult {
  return "isApproved" in value;
}

type Props = StackNavigatorProps<CantonOnboardAccountParamList, ScreenName.CantonOnboardAccount>;

export default function Accept({ navigation, route }: Props) {
  const accs = useMemo(() => route.params?.accountsToAdd ?? [], [route.params?.accountsToAdd]);
  const currency = route.params?.currency;
  const device = useSelector(lastConnectedDeviceSelector);
  const [disabled, setDisabled] = useState(false);
  const [result, setResult] = useState<CantonOnboardResult | null>(null);
  const existingAccounts = useSelector(accountsSelector);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Get the bridge for the currency
  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const bridge = getCurrencyBridge(cryptoCurrency) as CantonCurrencyBridge;

  const retryOnboard = useCallback(() => {
    if (!device) return;

    setError(null);
    setDisabled(true);

    const notUsedAccount = accs.find(account => !account.used);
    if (!notUsedAccount) return;
    if (subscription) {
      subscription.unsubscribe();
    }

    const sub = bridge
      .onboardAccount(cryptoCurrency, device.deviceId, notUsedAccount)
      .pipe(
        filter(value => isCantonOnboardResult(value) && !!value.partyId),
        take(1),
      )
      .subscribe(
        result => {
          setError(null);
          setDisabled(false);
          if (isCantonOnboardResult(result)) {
            setResult(result);
          }
        },
        (e: Error) => {
          setError(e);
          setDisabled(false);
        },
      );
    setSubscription(sub);
  }, [cryptoCurrency, device, accs, bridge, subscription]);

  const onPress = useCallback(() => {
    if (!device || !result) return;

    setDisabled(true);
    if (subscription) {
      subscription.unsubscribe();
    }
    const sub = bridge
      .authorizePreapproval(cryptoCurrency, device.deviceId, result.account, result.partyId)
      .pipe(
        filter(value => isCantonAuthorizeResult(value) && value.isApproved),
        take(1),
      )
      .subscribe(() => {
        const newAccount = accs.find(a => a.freshAddressPath === result.account.freshAddressPath);
        if (newAccount) {
          newAccount.id = result.account.id;
          newAccount.xpub = result.account.xpub;
        }
        setError(null);
        dispatch(
          addAccountsAction({
            existingAccounts,
            scannedAccounts: accs,
            selectedIds: accs.map(account => account.id),
            renamings: {},
          }),
        );
        navigation.getParent()?.navigate(NavigatorName.AddAccounts, {
          screen: ScreenName.AddAccountsSuccess,
          params: {
            accountsToAdd: accs,
            currency: cryptoCurrency,
          },
        });
      });
    setSubscription(sub);
  }, [
    cryptoCurrency,
    device,
    bridge,
    result,
    navigation,
    dispatch,
    existingAccounts,
    accs,
    subscription,
  ]);

  const action = useAppDeviceAction();

  useEffect(() => {
    if (!device) return;
    const notUsedAccount = accs.find(account => !account.used);
    if (!notUsedAccount) return;

    setDisabled(true);
    const sub = bridge
      .onboardAccount(cryptoCurrency, device.deviceId, notUsedAccount)
      .pipe(
        filter(value => isCantonOnboardResult(value) && !!value.partyId),
        take(1),
      )
      .subscribe(
        result => {
          setError(null);
          setDisabled(false);
          if (isCantonOnboardResult(result)) {
            setResult(result);
          }
        },
        (e: Error) => {
          setError(e);
          setDisabled(false);
        },
      );
    setSubscription(sub);
    return () => sub.unsubscribe();
  }, [cryptoCurrency, device, accs, bridge, currency, navigation]);

  useLayoutEffect(() => {
    const notUsedAccounts = accs.filter(account => !account.used);
    if (notUsedAccounts.length === 0 && !updated) {
      setUpdated(true);
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: accs,
          selectedIds: accs.map(account => account.id),
          renamings: {},
        }),
      );
      navigation.getParent()?.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsSuccess,
        params: {
          accountsToAdd: accs,
          currency: cryptoCurrency,
        },
      });
    }
  }, [accs, navigation, cryptoCurrency, dispatch, existingAccounts, updated]);

  if (disabled && device && cryptoCurrency) {
    return (
      <DeviceActionModal
        device={device}
        action={action}
        request={{ currency: cryptoCurrency }}
        preventBackdropClick
        noCloseButton
      />
    );
  }

  return (
    <Flex
      flexDirection="column"
      alignItems="stretch"
      flex={1}
      justifyContent="space-between"
      pb={10}
    >
      <Flex flexDirection="column" alignItems="stretch" flex={1}>
        <Text
          variant="h4"
          testID="receive-header-step2-title"
          fontSize="24px"
          color="neutral.c100"
          px={6}
        >
          <Trans i18nKey="canton.onboard.title" />
        </Text>
        <Text
          fontWeight="semiBold"
          flexShrink={1}
          color="neutral.c70"
          numberOfLines={1}
          px={6}
          mt={4}
        >
          <Trans i18nKey="canton.onboard.account" />
        </Text>
        <SelectableAccountsList
          accounts={accs}
          selectedIds={accs.map(account => account.id)}
          isDisabled={false}
          header={null}
          index={0}
          showHint={false}
        />

        <Text fontWeight="semiBold" flexShrink={1} color="neutral.c70" numberOfLines={1} px={6}>
          <Trans i18nKey="canton.onboard.authorize" />
        </Text>
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          mt={4}
          py={4}
          mx={6}
          px={4}
          backgroundColor="neutral.c30"
          borderRadius={2}
        >
          <Flex flexDirection="row" alignItems="center">
            <IconBox iconSize={28} boxSize={40} Icon={LedgerIcon} />
            <Text>
              <Trans i18nKey="canton.onboard.validator" />
            </Text>
          </Flex>
          <Checkbox checked={true} />
        </Flex>
        {error && (
          <Flex flexDirection="column" alignItems="stretch" mt={4} mx={6}>
            <Alert title={t("canton.onboard.error429")} type="error">
              <LearnMore />
            </Alert>
            <Button type="main" onPress={retryOnboard} disabled={disabled} mt={4}>
              <Trans i18nKey="common.retry" />
            </Button>
          </Flex>
        )}
      </Flex>
      <Flex px={6}>
        <Button type={"main"} onPress={onPress} disabled={disabled || !result}>
          <Trans i18nKey="common.confirm" />
        </Button>
      </Flex>
    </Flex>
  );
}
