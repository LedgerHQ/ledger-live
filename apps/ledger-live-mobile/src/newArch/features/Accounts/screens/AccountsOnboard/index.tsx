import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  AuthorizeStatus,
  OnboardStatus,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardResult,
  CantonOnboardProgress,
} from "@ledgerhq/coin-canton/types";
import invariant from "invariant";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { Observable } from "rxjs";
import { Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import { StackNavigatorProps, BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { NetworkBasedAddAccountNavigator, AddAccountContextType } from "../AddAccount/types";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { accountsSelector } from "~/reducers/accounts";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { Account } from "@ledgerhq/types-live";
import { Flex, Text, Button, Alert, Checkbox, IconBox } from "@ledgerhq/native-ui";
import DeviceActionModal from "~/components/DeviceActionModal";
import SelectableAccountsList from "~/components/SelectableAccountsList";
import { restoreNavigationSnapshot } from "~/families/canton/utils/navigationSnapshot";
import LedgerIcon from "~/icons/Ledger";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { Linking } from "react-native";

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

function getCreatableAccount(
  selectedAccounts: Account[],
  isReonboarding?: boolean,
  accountToReonboard?: Account,
): Account | undefined {
  if (isReonboarding && accountToReonboard) {
    return accountToReonboard;
  }
  return selectedAccounts.find(account => !account.used);
}

function getImportableAccounts(selectedAccounts: Account[]): Account[] {
  return selectedAccounts.filter(account => account.used);
}

type AddAccountsConfig = {
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  onboardingResult?: {
    completedAccount: Account;
  };
};

function prepareAccountsForReonboarding(
  accountToReonboard: Account,
  completedAccount: Account,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const updatedAccount = {
    ...accountToReonboard,
    ...completedAccount,
    id: accountToReonboard.id,
  };

  return {
    accounts: [updatedAccount],
    renamings: {
      [updatedAccount.id]:
        editedNames[accountToReonboard.id] || getDefaultAccountName(updatedAccount),
    },
  };
}

function prepareAccountsForNewOnboarding(
  importableAccounts: Account[],
  completedAccount: Account | undefined,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const accounts = [...importableAccounts];
  if (completedAccount) {
    accounts.push(completedAccount);
  }

  const importableAccountIds = new Set(importableAccounts.map(acc => acc.id));
  const [, completedAccountName] =
    Object.entries(editedNames).find(([accountId]) => !importableAccountIds.has(accountId)) || [];

  const renamings = Object.fromEntries(
    accounts.map(account => {
      let accountName = editedNames[account.id];

      if (completedAccount && account.id === completedAccount.id && completedAccountName) {
        accountName = completedAccountName;
      }

      return [account.id, accountName || getDefaultAccountName(account)];
    }),
  );

  return { accounts, renamings };
}

function prepareAccountsForAdding(config: AddAccountsConfig): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const { selectedAccounts, editedNames, isReonboarding, accountToReonboard, onboardingResult } =
    config;

  const importableAccounts = getImportableAccounts(selectedAccounts);
  const completedAccount = onboardingResult?.completedAccount;

  if (isReonboarding && completedAccount && accountToReonboard) {
    return prepareAccountsForReonboarding(accountToReonboard, completedAccount, editedNames);
  }

  return prepareAccountsForNewOnboarding(importableAccounts, completedAccount, editedNames);
}

export type OnboardingResult = {
  partyId: string;
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
  AUTHORIZE = "AUTHORIZE",
  FINISH = "FINISH",
}

type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AccountsOnboard>
>;

export default function AccountsOnboard({ navigation, route }: Props) {
  const {
    accountsToAdd: routeAccountsToAdd,
    currency,
    isReonboarding = false,
    accountToReonboard,
    restoreState,
    editedNames: routeEditedNames = {},
  } = route.params ?? {};

  const accountsToAdd = useMemo(() => routeAccountsToAdd ?? [], [routeAccountsToAdd]);
  const editedNames = useMemo(() => routeEditedNames, [routeEditedNames]);

  // Extract CommonParams that may be passed from parent navigator
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const commonParams = useMemo(
    () =>
      route.params as typeof route.params & {
        context?: AddAccountContextType;
        onCloseNavigation?: () => void;
        sourceScreenName?: string;
      },
    [route],
  );

  const deviceSelector = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();
  const skipCantonPreapprovalStep = useFeature("cantonSkipPreapprovalStep");
  const subscriptionRef = useRef<Subscription | null>(null);
  const { t } = useTranslation();

  const [stepId, setStepId] = useState<StepId>(StepId.ONBOARD);
  const [error, setError] = useState<Error | null>(null);
  const [authorizeStatus, setAuthorizeStatus] = useState<AuthorizeStatus>(AuthorizeStatus.INIT);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);
  const [updated, setUpdated] = useState(false);

  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const device = deviceSelector;
  const bridge = useMemo(() => {
    const currencyBridge = getCurrencyBridge(cryptoCurrency);
    if (!currencyBridge) {
      throw new Error(`Currency bridge not found for ${cryptoCurrency.id}`);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return currencyBridge as CantonCurrencyBridge;
  }, [cryptoCurrency]);

  const importableAccounts = useMemo(() => getImportableAccounts(accountsToAdd), [accountsToAdd]);

  const creatableAccount = useMemo(
    () => getCreatableAccount(accountsToAdd, isReonboarding, accountToReonboard),
    [accountsToAdd, isReonboarding, accountToReonboard],
  );

  const accountsToDisplay = useMemo(() => {
    if (isReonboarding && accountToReonboard) {
      return [accountToReonboard];
    }
    return accountsToAdd;
  }, [isReonboarding, accountToReonboard, accountsToAdd]);

  const selectedIds = useMemo(
    () => accountsToDisplay.map(account => account.id),
    [accountsToDisplay],
  );

  const deviceActionRequest = useMemo(() => ({ currency: cryptoCurrency }), [cryptoCurrency]);
  const action = useAppDeviceAction();

  invariant(device, "device is required");
  invariant(cryptoCurrency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const createSubscription = useCallback(
    <T,>(observable: Observable<T>, onNext: (value: T) => void) => {
      cleanupSubscription();
      subscriptionRef.current = observable.subscribe({
        next: onNext,
        error: (err: Error) => {
          setError(err);
          setIsProcessing(false);
          if (stepId === StepId.ONBOARD) {
            setOnboardingStatus(OnboardStatus.ERROR);
          } else if (stepId === StepId.AUTHORIZE) {
            setAuthorizeStatus(AuthorizeStatus.ERROR);
          }
        },
      });
    },
    [cleanupSubscription, stepId],
  );

  const handleSubscriptionError = useCallback(
    (error: Error) => {
      setError(error);
      setIsProcessing(false);
      if (stepId === StepId.ONBOARD) {
        setOnboardingStatus(OnboardStatus.ERROR);
      } else if (stepId === StepId.AUTHORIZE) {
        setAuthorizeStatus(AuthorizeStatus.ERROR);
      }
    },
    [stepId],
  );

  const navigateToSuccess = useCallback(() => {
    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts: accountsToAdd,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult: onboardingResult
        ? {
            completedAccount: onboardingResult.completedAccount,
          }
        : undefined,
    });

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(account => account.id),
        renamings,
      }),
    );

    navigation.replace(ScreenName.AddAccountsSuccess, {
      currency,
      accountsToAdd: accounts,
      context: commonParams.context,
      onCloseNavigation: commonParams.onCloseNavigation,
      sourceScreenName: commonParams.sourceScreenName,
    });
  }, [
    accountsToAdd,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
    dispatch,
    navigation,
    currency,
    commonParams,
  ]);

  const handleOnboardingComplete = useCallback(
    (onboardResult: CantonOnboardResult) => {
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts: accountsToAdd,
        existingAccounts,
        editedNames,
        isReonboarding,
        accountToReonboard,
        onboardingResult: {
          completedAccount: onboardResult.account,
        },
      });

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(account => account.id),
          renamings,
        }),
      );

      if (restoreState) {
        restoreNavigationSnapshot(navigation, restoreState);
      } else {
        navigateToSuccess();
      }
    },
    [
      accountsToAdd,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      dispatch,
      restoreState,
      navigation,
      navigateToSuccess,
    ],
  );

  const handleReonboardingComplete = useCallback(
    (onboardResult: CantonOnboardResult) => {
      if (!accountToReonboard) return;

      const { accounts, renamings } = prepareAccountsForReonboarding(
        accountToReonboard,
        onboardResult.account,
        editedNames,
      );

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(account => account.id),
          renamings,
        }),
      );

      if (restoreState) {
        restoreNavigationSnapshot(navigation, restoreState);
      } else {
        navigateToSuccess();
      }
    },
    [
      accountToReonboard,
      editedNames,
      existingAccounts,
      dispatch,
      restoreState,
      navigation,
      navigateToSuccess,
    ],
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

  const handleOnboardAccount = useCallback(() => {
    if (!creatableAccount || !device) return;

    setIsProcessing(true);
    setOnboardingStatus(OnboardStatus.PREPARE);
    setError(null);

    try {
      const onboardObservable = bridge
        .onboardAccount(cryptoCurrency, device.deviceId, creatableAccount)
        .pipe(filter(isCompleteOnboardResult), take(1));

      createSubscription(
        onboardObservable,
        (value: CantonOnboardProgress | CantonOnboardResult) => {
          if (!isCantonOnboardResult(value)) {
            if ("status" in value) {
              setOnboardingStatus(value.status);
            }
            return;
          }

          setOnboardingResult({
            partyId: value.partyId,
            completedAccount: value.account,
          });
          setOnboardingStatus(OnboardStatus.SUCCESS);
          setIsProcessing(false);

          if (skipCantonPreapprovalStep?.enabled) {
            finishOnboarding(value);
          } else {
            setStepId(StepId.AUTHORIZE);
          }
        },
      );
    } catch (error) {
      handleSubscriptionError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    creatableAccount,
    device,
    cryptoCurrency,
    bridge,
    createSubscription,
    handleSubscriptionError,
    skipCantonPreapprovalStep,
    finishOnboarding,
  ]);

  const handleAuthorizePreapproval = useCallback(() => {
    if (!onboardingResult || !device) return;

    setIsProcessing(true);
    setAuthorizeStatus(AuthorizeStatus.PREPARE);
    setError(null);

    const { completedAccount, partyId } = onboardingResult;

    try {
      const authorizeObservable = bridge
        .authorizePreapproval(cryptoCurrency, device.deviceId, completedAccount, partyId)
        .pipe(filter(isApprovedAuthorizeResult), take(1));

      createSubscription(authorizeObservable, () => {
        finishOnboarding({
          account: completedAccount,
          partyId,
        } as CantonOnboardResult);
      });
    } catch (error) {
      handleSubscriptionError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    onboardingResult,
    device,
    cryptoCurrency,
    bridge,
    createSubscription,
    handleSubscriptionError,
    finishOnboarding,
  ]);

  const handleRetryOnboardAccount = useCallback(() => {
    cleanupSubscription();
    setStepId(StepId.ONBOARD);
    setError(null);
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setOnboardingStatus(OnboardStatus.INIT);
    setIsProcessing(false);
    setOnboardingResult(null);
  }, [cleanupSubscription]);

  const handleRetryPreapproval = useCallback(() => {
    cleanupSubscription();
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setIsProcessing(false);
    setError(null);
  }, [cleanupSubscription]);

  useEffect(() => {
    return cleanupSubscription;
  }, [cleanupSubscription]);

  useEffect(() => {
    if (!device || !creatableAccount) {
      return;
    }

    if (isReonboarding) {
      return;
    }

    handleOnboardAccount();
  }, [device, creatableAccount, isReonboarding, handleOnboardAccount]);

  useLayoutEffect(() => {
    if (isReonboarding) return;

    const unusedAccounts = accountsToAdd.filter(account => !account.used);
    if (unusedAccounts.length === 0 && !updated) {
      setUpdated(true);
      const { accounts, renamings } = prepareAccountsForAdding({
        selectedAccounts: accountsToAdd,
        existingAccounts,
        editedNames,
        isReonboarding,
        accountToReonboard,
      });

      dispatch(
        addAccountsAction({
          scannedAccounts: accounts,
          existingAccounts,
          selectedIds: accounts.map(account => account.id),
          renamings,
        }),
      );

      navigateToSuccess();
    }
  }, [
    accountsToAdd,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    updated,
    dispatch,
    navigateToSuccess,
  ]);

  const link = useLocalizedUrl(urls.canton.learnMore);
  const handleLearnMore = useCallback(() => {
    Linking.openURL(link);
  }, [link]);

  const renderStepContent = () => {
    switch (stepId) {
      case StepId.ONBOARD:
        return renderOnboardStep();
      case StepId.AUTHORIZE:
        return renderAuthorizeStep();
      case StepId.FINISH:
        return renderFinishStep();
      default:
        return null;
    }
  };

  const renderOnboardStep = () => {
    const isSigning = onboardingStatus === OnboardStatus.SIGN;
    const isSuccess = onboardingStatus === OnboardStatus.SUCCESS;
    const isError = onboardingStatus === OnboardStatus.ERROR;
    const isAxios429Error = isError && error && "status" in error && error.status === 429;

    if (isSigning && device && cryptoCurrency) {
      return null; // DeviceActionModal will be shown
    }

    return (
      <Flex flexDirection="column" alignItems="stretch" flex={1}>
        <Text variant="h4" fontSize="24px" color="neutral.c100" px={6}>
          <Trans
            i18nKey={isReonboarding ? "canton.onboard.reonboard.title" : "canton.onboard.title"}
          />
        </Text>
        <Text fontWeight="semiBold" color="neutral.c70" numberOfLines={1} px={6} mt={4}>
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

        {isSuccess && (
          <Flex mt={4} px={6}>
            <Alert type="success">
              <Trans
                i18nKey={
                  isReonboarding ? "canton.onboard.reonboard.success" : "canton.onboard.success"
                }
              />
            </Alert>
          </Flex>
        )}

        {isAxios429Error && (
          <Flex mt={4} px={6}>
            <Alert type="error">
              <Trans i18nKey="canton.onboard.error429" />
              <Text onPress={handleLearnMore} color="primary.c80" mt={2}>
                <Trans i18nKey="common.learnMore" />
              </Text>
            </Alert>
          </Flex>
        )}

        {isError && !isAxios429Error && (
          <Flex mt={4} px={6}>
            <Alert type="error">
              <Trans i18nKey="canton.onboard.error" />
            </Alert>
          </Flex>
        )}

        {!isSuccess && !isError && onboardingStatus !== OnboardStatus.INIT && (
          <Text color="neutral.c70" px={6} mt={4}>
            <Trans
              i18nKey={
                onboardingStatus === OnboardStatus.PREPARE
                  ? "canton.onboard.status.prepare"
                  : onboardingStatus === OnboardStatus.SUBMIT
                    ? "canton.onboard.status.submit"
                    : "canton.onboard.status.default"
              }
            />
          </Text>
        )}
      </Flex>
    );
  };

  const renderAuthorizeStep = () => {
    const isSigning = authorizeStatus === AuthorizeStatus.SIGN;
    const isError = authorizeStatus === AuthorizeStatus.ERROR;

    if (isSigning && device && cryptoCurrency) {
      return null; // DeviceActionModal will be shown
    }

    if (!onboardingResult) return null;

    return (
      <Flex flexDirection="column" alignItems="stretch" flex={1}>
        <Text variant="h4" fontSize="24px" color="neutral.c100" px={6}>
          <Trans i18nKey="canton.onboard.auth.title" />
        </Text>
        <Text fontWeight="semiBold" color="neutral.c70" numberOfLines={1} px={6} mt={4}>
          <Trans i18nKey="operationDetails.account" />
        </Text>
        <SelectableAccountsList
          accounts={[onboardingResult.completedAccount]}
          selectedIds={[onboardingResult.completedAccount.id]}
          isDisabled={false}
          header={null}
          index={0}
          showHint={false}
        />

        <Text fontWeight="semiBold" color="neutral.c70" numberOfLines={1} px={6} mt={4}>
          <Trans i18nKey="canton.onboard.validator" />
        </Text>
        <ValidatorSection />

        {isError && (
          <Flex mt={4} px={6}>
            <Alert type="error">
              <Trans i18nKey="canton.onboard.auth.error" />
            </Alert>
          </Flex>
        )}

        {!isError && (
          <Flex mt={4} px={6}>
            <Alert type="info">
              <Trans
                i18nKey={
                  isReonboarding ? "canton.onboard.auth.reonboard.hint" : "canton.onboard.auth.hint"
                }
              />
              <Text onPress={handleLearnMore} color="primary.c80" mt={2}>
                <Trans i18nKey="common.learnMore" />
              </Text>
            </Alert>
          </Flex>
        )}
      </Flex>
    );
  };

  const renderFinishStep = () => {
    const accounts = [...importableAccounts];
    if (onboardingResult?.completedAccount) {
      accounts.push(onboardingResult.completedAccount);
    }

    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center" flex={1} px={6}>
        <IconBox Icon={LedgerIcon} iconSize={24} />
        <Text variant="h4" fontSize="24px" color="neutral.c100" mt={4} textAlign="center">
          {isReonboarding
            ? t("canton.onboard.reonboard.success")
            : t("addAccounts.success", { count: accounts.length })}
        </Text>
        <Text variant="body" color="neutral.c70" mt={2} textAlign="center">
          {isReonboarding
            ? t("canton.onboard.reonboard.successDescription")
            : t("addAccounts.successDescription", { count: accounts.length })}
        </Text>
      </Flex>
    );
  };

  const renderFooter = () => {
    switch (stepId) {
      case StepId.ONBOARD:
        if (onboardingStatus === OnboardStatus.SIGN) {
          return null;
        }
        if (onboardingStatus === OnboardStatus.SUCCESS) {
          return (
            <Button
              type="main"
              onPress={() => {
                if (skipCantonPreapprovalStep?.enabled) {
                  setStepId(StepId.FINISH);
                  if (onboardingResult) {
                    finishOnboarding({
                      account: onboardingResult.completedAccount,
                      partyId: onboardingResult.partyId,
                    } as CantonOnboardResult);
                  }
                } else {
                  setStepId(StepId.AUTHORIZE);
                }
              }}
              disabled={isProcessing}
            >
              <Trans i18nKey="common.continue" />
            </Button>
          );
        }
        if (onboardingStatus === OnboardStatus.ERROR) {
          return (
            <Button type="main" onPress={handleRetryOnboardAccount} disabled={isProcessing}>
              <Trans i18nKey="common.tryAgain" />
            </Button>
          );
        }
        return (
          <Button type="main" onPress={handleOnboardAccount} disabled={isProcessing}>
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case StepId.AUTHORIZE:
        if (authorizeStatus === AuthorizeStatus.SIGN) {
          return null;
        }
        if (authorizeStatus === AuthorizeStatus.ERROR) {
          return (
            <Button type="main" onPress={handleRetryPreapproval}>
              <Trans i18nKey="common.tryAgain" />
            </Button>
          );
        }
        return (
          <Button
            type="main"
            onPress={handleAuthorizePreapproval}
            disabled={isProcessing || !onboardingResult}
          >
            <Trans i18nKey="common.confirm" />
          </Button>
        );
      case StepId.FINISH:
        return (
          <Button type="main" onPress={navigateToSuccess}>
            {isReonboarding ? <Trans i18nKey="common.continue" /> : <Trans i18nKey="common.done" />}
          </Button>
        );
      default:
        return null;
    }
  };

  const showDeviceAction =
    (stepId === StepId.ONBOARD && onboardingStatus === OnboardStatus.SIGN) ||
    (stepId === StepId.AUTHORIZE && authorizeStatus === AuthorizeStatus.SIGN);

  return (
    <Flex
      flexDirection="column"
      alignItems="stretch"
      flex={1}
      justifyContent="space-between"
      pb={10}
    >
      {showDeviceAction && device && cryptoCurrency ? (
        <DeviceActionModal
          device={device}
          action={action}
          request={deviceActionRequest}
          preventBackdropClick
          noCloseButton
        />
      ) : (
        <>
          {renderStepContent()}
          <Flex px={6} mt={4}>
            {renderFooter()}
          </Flex>
        </>
      )}
    </Flex>
  );
}

const ValidatorSection = () => (
  <Flex
    flexDirection="row"
    alignItems="center"
    justifyContent="space-between"
    mt={4}
    px={6}
    py={3}
    bg="neutral.c30"
    borderRadius={4}
    borderWidth={1}
    borderColor="neutral.c40"
  >
    <IconBox Icon={LedgerIcon} iconSize={18} />
    <Flex flex={1} ml={3}>
      <Text fontSize={16} fontWeight="semiBold" color="neutral.c100">
        <Trans i18nKey="canton.onboard.validatorLabel" />
      </Text>
      <Text fontSize={14} color="neutral.c70">
        <Trans i18nKey="canton.onboard.validatorDescription" />
      </Text>
    </Flex>
    <Checkbox checked={true} disabled={true} />
  </Flex>
);
