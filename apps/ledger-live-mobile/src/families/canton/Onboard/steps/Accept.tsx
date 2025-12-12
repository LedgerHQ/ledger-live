import type {
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonCurrencyBridge,
  CantonOnboardProgress,
  CantonOnboardResult,
} from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Alert, Button, Checkbox, Flex, IconBox, Text } from "@ledgerhq/native-ui";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import { useSelector, useDispatch } from "~/context/store";
import { Observable, Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import styled from "styled-components/native";
import DeviceActionModal from "~/components/DeviceActionModal";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SelectableAccountsList from "~/components/SelectableAccountsList";
import { NavigatorName, ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import LedgerIcon from "~/icons/Ledger";
import { accountsSelector } from "~/reducers/accounts";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import { restoreNavigationSnapshot } from "../../utils/navigationSnapshot";
import { CantonOnboardAccountParamList } from "../types";

function isCantonOnboardResult(
  value: CantonOnboardProgress | CantonOnboardResult,
): value is CantonOnboardResult {
  return "partyId" in value;
}

function isCantonAuthorizeResult(
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): value is CantonAuthorizeResult {
  return "isApproved" in value;
}

const isCompleteOnboardResult = (value: CantonOnboardProgress | CantonOnboardResult): boolean =>
  isCantonOnboardResult(value) && !!value.partyId;

const isApprovedAuthorizeResult = (
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): boolean => isCantonAuthorizeResult(value) && value.isApproved;

type Props = StackNavigatorProps<CantonOnboardAccountParamList, ScreenName.CantonOnboardAccount>;

export default function Accept({ navigation, route }: Props) {
  const {
    accountsToAdd: routeAccountsToAdd,
    currency,
    isReonboarding = false,
    accountToReonboard,
    restoreState,
  } = route.params ?? {};

  const accountsToAdd = useMemo(() => routeAccountsToAdd ?? [], [routeAccountsToAdd]);

  const device = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();
  const skipCantonPreapprovalStep = useFeature("cantonSkipPreapprovalStep");
  const subscriptionRef = useRef<Subscription | null>(null);

  const [disabled, setDisabled] = useState(false);
  const [result, setResult] = useState<CantonOnboardResult | null>(null);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const bridge = useMemo(() => {
    const currencyBridge = getCurrencyBridge(cryptoCurrency);
    if (!currencyBridge) {
      throw new Error(`Currency bridge not found for ${cryptoCurrency.id}`);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return currencyBridge as CantonCurrencyBridge;
  }, [cryptoCurrency]);

  const accountsToDisplay = useMemo(() => {
    if (isReonboarding && accountToReonboard) {
      return [accountToReonboard];
    }
    return accountsToAdd;
  }, [isReonboarding, accountToReonboard, accountsToAdd]);

  const accountToOnboard = useMemo(() => {
    if (isReonboarding && accountToReonboard) {
      return accountToReonboard;
    }
    return (accountsToAdd as CantonAccount[]).find(
      account => !account.cantonResources?.isOnboarded,
    );
  }, [isReonboarding, accountToReonboard, accountsToAdd]);

  const selectedIds = useMemo(
    () => accountsToDisplay.map(account => account.id),
    [accountsToDisplay],
  );

  const deviceActionRequest = useMemo(() => ({ currency: cryptoCurrency }), [cryptoCurrency]);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const handleSubscriptionError = useCallback((e: Error) => {
    setError(e);
    setDisabled(false);
  }, []);

  const dispatchAddAccounts = useCallback(
    (scannedAccounts: typeof accountsToAdd, selectedIds: string[]) => {
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts,
          selectedIds,
          renamings: {},
        }),
      );
    },
    [dispatch, existingAccounts],
  );

  const navigateToSuccess = useCallback(() => {
    navigation.getParent()?.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSuccess,
      params: {
        accountsToAdd,
        currency: cryptoCurrency,
      },
    });
  }, [navigation, accountsToAdd, cryptoCurrency]);

  const createSubscription = useCallback(
    <T,>(
      observable: Observable<T>,
      onSuccess: (value: T) => void,
      onError?: (error: Error) => void,
    ) => {
      cleanupSubscription();
      const errorHandler = onError || handleSubscriptionError;
      const subscription = observable.subscribe({
        next: onSuccess,
        error: (error: Error) => {
          errorHandler(error);
        },
      });
      subscriptionRef.current = subscription;
    },
    [cleanupSubscription, handleSubscriptionError],
  );

  const handleReonboardingComplete = useCallback(
    (onboardResult: CantonOnboardResult) => {
      if (!accountToReonboard) return;

      const updatedAccount = {
        ...accountToReonboard,
        ...onboardResult.account,
        id: accountToReonboard.id,
      };

      setError(null);
      dispatchAddAccounts([updatedAccount], [updatedAccount.id]);

      if (restoreState) {
        restoreNavigationSnapshot(navigation, restoreState);
      } else {
        navigation.goBack();
      }
    },
    [accountToReonboard, dispatchAddAccounts, navigation, restoreState],
  );

  const handleOnboardingComplete = useCallback(
    (onboardResult: CantonOnboardResult) => {
      const newAccount = accountsToAdd.find(
        a => a.freshAddressPath === onboardResult.account.freshAddressPath,
      );
      if (newAccount) {
        newAccount.id = onboardResult.account.id;
        newAccount.xpub = onboardResult.account.xpub;
      }

      setError(null);
      dispatchAddAccounts(
        accountsToAdd,
        accountsToAdd.map(account => account.id),
      );
      navigateToSuccess();
    },
    [accountsToAdd, dispatchAddAccounts, navigateToSuccess],
  );

  const finishOnboarding = useCallback(
    (onboardResult: CantonOnboardResult) => {
      if (isReonboarding && accountToReonboard) {
        handleReonboardingComplete(onboardResult);
      } else {
        handleOnboardingComplete(onboardResult);
      }
    },
    [isReonboarding, accountToReonboard, handleReonboardingComplete, handleOnboardingComplete],
  );

  const retryOnboard = useCallback(() => {
    if (!device || !accountToOnboard) return;

    setError(null);
    setDisabled(true);

    try {
      const onboardObservable = bridge
        .onboardAccount(cryptoCurrency, device.deviceId, accountToOnboard)
        .pipe(filter(isCompleteOnboardResult), take(1));

      createSubscription(
        onboardObservable,
        (value: CantonOnboardProgress | CantonOnboardResult) => {
          if (!isCantonOnboardResult(value)) return;

          setError(null);
          setDisabled(false);
          setResult(value);
          if (skipCantonPreapprovalStep?.enabled) {
            finishOnboarding(value);
          }
        },
      );
    } catch (error) {
      handleSubscriptionError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    cryptoCurrency,
    device,
    accountToOnboard,
    bridge,
    skipCantonPreapprovalStep?.enabled,
    finishOnboarding,
    createSubscription,
    handleSubscriptionError,
  ]);

  const handleConfirm = useCallback(() => {
    // During reonboarding, if we don't have a result yet, start onboarding first
    if (isReonboarding && !result) {
      if (!device || !accountToOnboard) return;
      retryOnboard();
      return;
    }

    // Normal flow: authorize preapproval if we have a result
    if (!device || !result) return;

    setDisabled(true);

    const authorizeObservable = bridge
      .authorizePreapproval(cryptoCurrency, device.deviceId, result.account, result.partyId)
      .pipe(filter(isApprovedAuthorizeResult), take(1));

    createSubscription(authorizeObservable, () => {
      finishOnboarding(result);
    });
  }, [
    isReonboarding,
    result,
    device,
    accountToOnboard,
    cryptoCurrency,
    bridge,
    finishOnboarding,
    createSubscription,
    retryOnboard,
  ]);

  const action = useAppDeviceAction();

  useEffect(() => {
    if (!device || !accountToOnboard) {
      return;
    }

    // During reonboarding, don't auto-start onboarding if device isn't ready
    // Wait for user to connect device manually
    if (isReonboarding) {
      return cleanupSubscription;
    }

    retryOnboard();
    return cleanupSubscription;
  }, [device, accountToOnboard, retryOnboard, cleanupSubscription, isReonboarding]);

  useLayoutEffect(() => {
    // Skip this effect during reonboarding - reonboarding flow is handled in finishOnboarding
    if (isReonboarding) return;

    const unusedAccounts = accountsToAdd.filter(account => !account.used);
    if (unusedAccounts.length === 0 && !updated) {
      setUpdated(true);
      dispatchAddAccounts(
        accountsToAdd,
        accountsToAdd.map(account => account.id),
      );
      navigateToSuccess();
    }
  }, [accountsToAdd, dispatchAddAccounts, updated, isReonboarding, navigateToSuccess]);

  if (disabled && device && cryptoCurrency) {
    return (
      <DeviceActionModal
        device={device}
        action={action}
        request={deviceActionRequest}
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
          <Trans
            i18nKey={isReonboarding ? "canton.onboard.reonboard.title" : "canton.onboard.title"}
          />
        </Text>
        <Text
          fontWeight="semiBold"
          flexShrink={1}
          color="neutral.c70"
          numberOfLines={1}
          px={6}
          mt={4}
        >
          <Trans
            i18nKey={isReonboarding ? "canton.onboard.reonboard.account" : "canton.onboard.account"}
          />
        </Text>
        <SelectableAccountsList
          accounts={accountsToDisplay}
          selectedIds={selectedIds}
          isDisabled={false}
          header={null}
          index={0}
          showHint={false}
        />

        <Text fontWeight="semiBold" flexShrink={1} color="neutral.c70" numberOfLines={1} px={6}>
          <Trans
            i18nKey={
              isReonboarding ? "canton.onboard.reonboard.authorize" : "canton.onboard.authorize"
            }
          />
        </Text>
        <ValidatorSection />
        {isReonboarding && <ReonboardingWarning />}
        {error && <ErrorSection disabled={disabled} onRetry={retryOnboard} />}
      </Flex>
      <Flex px={6}>
        <Button
          type={"main"}
          onPress={handleConfirm}
          disabled={disabled || (!isReonboarding && !result)}
        >
          <Trans i18nKey="common.confirm" />
        </Button>
      </Flex>
    </Flex>
  );
}

const ValidatorSection = () => (
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
      <Text ml={3}>
        <Trans i18nKey="canton.onboard.validator" />
      </Text>
    </Flex>
    <Checkbox checked={true} />
  </Flex>
);

const ReonboardingWarning = () => {
  const { t } = useTranslation();
  return (
    <Flex mx={6} mt={8}>
      <Alert type="warning">
        <Flex flexDirection="column" rowGap={4} flex={1} flexShrink={1}>
          <Text variant="bodyLineHeight" fontWeight="semiBold" color="neutral.c100" flexShrink={1}>
            {t("canton.onboard.reonboard.warning.title")}
          </Text>
          <Text variant="body" color="neutral.c100" flexShrink={1}>
            {t("canton.onboard.reonboard.warning.description")}
          </Text>
        </Flex>
      </Alert>
    </Flex>
  );
};

const ErrorSection = ({ disabled, onRetry }: { disabled: boolean; onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignItems="stretch" mt={4} mx={6}>
      <Alert title={t("canton.onboard.error429")} type="error">
        <LearnMore />
      </Alert>
      <Button type="main" onPress={onRetry} disabled={disabled} mt={4}>
        <Trans i18nKey="common.retry" />
      </Button>
    </Flex>
  );
};

export const LearnMore = (): React.JSX.Element => {
  const link = useLocalizedUrl(urls.canton.learnMore);

  return (
    <LinkTouchable onPress={() => Linking.openURL(link)}>
      <Alert.UnderlinedText mr="5px">
        <Trans i18nKey="common.learnMore" />
      </Alert.UnderlinedText>
    </LinkTouchable>
  );
};

const LinkTouchable = styled(TouchableOpacity).attrs({
  activeOpacity: 0.5,
})`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
`;
