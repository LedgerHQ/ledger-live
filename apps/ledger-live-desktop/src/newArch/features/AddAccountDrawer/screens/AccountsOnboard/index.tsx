import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  AuthorizeStatus,
  OnboardStatus,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardResult,
  CantonOnboardProgress,
} from "@ledgerhq/coin-canton/types";
import { AxiosError } from "axios";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Subscription } from "rxjs";
import { openModal } from "~/renderer/actions/modals";
import logger from "~/renderer/logger";
import { setDrawer } from "~/renderer/drawers/Provider";
import { Box, Flex } from "@ledgerhq/react-ui";
import { ScrollContainer } from "../../components/ScrollContainer";
import StepAuthorize, {
  StepAuthorizeFooter,
} from "~/renderer/families/canton/OnboardModal/steps/StepAuthorize";
import StepFinish, {
  StepFinishFooter,
} from "~/renderer/families/canton/OnboardModal/steps/StepFinish";
import StepOnboard, {
  StepOnboardFooter,
} from "~/renderer/families/canton/OnboardModal/steps/StepOnboard";
import { StepId } from "~/renderer/families/canton/OnboardModal/types";
import type { StepProps, OnboardingResult } from "~/renderer/families/canton/OnboardModal/types";

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

function resolveAccountName(
  account: Account,
  editedNames: { [accountId: string]: string },
): string {
  return editedNames[account.id] || getDefaultAccountName(account);
}

function resolveCreatableAccountName(
  creatableAccount: Account | undefined,
  currency: CryptoCurrency,
  editedNames: { [accountId: string]: string },
  importableAccountsCount: number,
): string {
  if (!creatableAccount) {
    return `${currency.name} ${importableAccountsCount + 1}`;
  }
  return resolveAccountName(creatableAccount, editedNames);
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

  // on previous step we don't have a partyId yet for onboarding account
  // so editedNames use a temporary account ID
  // since only one account is onboarded at a time, we cane filter out importableAccounts renamings
  // what is left belongs to the onboarded account
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

interface CantonOnboardProps {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  onComplete: (accounts: Account[]) => void;
}

export default function CantonOnboard({
  currency,
  device,
  selectedAccounts,
  existingAccounts,
  editedNames,
  isReonboarding = false,
  accountToReonboard,
  onComplete,
}: CantonOnboardProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [stepId, setStepId] = useState<StepId>(StepId.ONBOARD);
  const [error, setError] = useState<AxiosError | null>(null);
  const [authorizeStatus, setAuthorizeStatus] = useState<AuthorizeStatus>(AuthorizeStatus.INIT);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | undefined>(undefined);

  const onboardingSubscriptionRef = useRef<Subscription | undefined>();
  const authorizeSubscriptionRef = useRef<Subscription | undefined>();

  const cantonBridge = useMemo(
    () => getCurrencyBridge(currency) as CantonCurrencyBridge,
    [currency],
  );

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const creatableAccount = useMemo(
    () => getCreatableAccount(selectedAccounts, isReonboarding, accountToReonboard),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  const accountName = useMemo(
    () =>
      resolveCreatableAccountName(
        creatableAccount,
        currency,
        editedNames,
        importableAccounts.length,
      ),
    [creatableAccount, currency, editedNames, importableAccounts.length],
  );

  useEffect(() => {
    return () => {
      // Cleanup subscriptions on unmount
      if (onboardingSubscriptionRef.current) {
        onboardingSubscriptionRef.current.unsubscribe();
      }
      if (authorizeSubscriptionRef.current) {
        authorizeSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const handleUnsubscribe = useCallback(() => {
    if (onboardingSubscriptionRef.current) {
      onboardingSubscriptionRef.current.unsubscribe();
      onboardingSubscriptionRef.current = undefined;
    }
    if (authorizeSubscriptionRef.current) {
      authorizeSubscriptionRef.current.unsubscribe();
      authorizeSubscriptionRef.current = undefined;
    }
  }, []);

  const handleRetryOnboardAccount = useCallback(() => {
    handleUnsubscribe();
    setStepId(StepId.ONBOARD);
    setError(null);
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setOnboardingStatus(OnboardStatus.INIT);
    setIsProcessing(false);
    setOnboardingResult(undefined);
  }, [handleUnsubscribe]);

  const handleRetryPreapproval = useCallback(() => {
    handleUnsubscribe();
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setIsProcessing(false);
    setError(null);
  }, [handleUnsubscribe]);

  const transitionTo = useCallback((newStepId: StepId) => {
    setStepId(newStepId);
  }, []);

  const handleAddMore = useCallback(() => {
    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult,
    });

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(account => account.id),
        renamings,
      }),
    );

    setDrawer();
    dispatch(
      openModal("MODAL_ADD_ACCOUNTS", {
        currency,
      }),
    );
  }, [
    currency,
    dispatch,
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
  ]);

  const handleAddAccounts = useCallback(() => {
    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult,
    });

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(account => account.id),
        renamings,
      }),
    );

    setDrawer();
    onComplete(accounts);
  }, [
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    onboardingResult,
    dispatch,
    onComplete,
  ]);

  const handleOnboardAccount = useCallback(() => {
    invariant(creatableAccount, "creatableAccount is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    setIsProcessing(true);
    setOnboardingStatus(OnboardStatus.PREPARE);
    setError(null);

    if (onboardingSubscriptionRef.current) {
      onboardingSubscriptionRef.current.unsubscribe();
    }

    onboardingSubscriptionRef.current = cantonBridge
      .onboardAccount(currency, device.deviceId, creatableAccount)
      .subscribe({
        next: (data: CantonOnboardProgress | CantonOnboardResult) => {
          if ("status" in data) {
            setOnboardingStatus(data.status);
          }

          if ("account" in data && "partyId" in data) {
            setOnboardingResult({
              partyId: data.partyId,
              completedAccount: data.account,
            });
            setOnboardingStatus(OnboardStatus.SUCCESS);
            setIsProcessing(false);
          }
        },
        complete: () => {},
        error: (err: AxiosError) => {
          logger.error("[handleOnboardAccount] failed", err);
          setOnboardingStatus(OnboardStatus.ERROR);
          setIsProcessing(false);
          setError(err);
        },
      });
  }, [creatableAccount, device, currency, cantonBridge]);

  const handleAuthorizePreapproval = useCallback(() => {
    invariant(onboardingResult, "onboardingResult is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    setIsProcessing(true);
    setAuthorizeStatus(AuthorizeStatus.PREPARE);
    setError(null);

    const { completedAccount, partyId } = onboardingResult;

    if (authorizeSubscriptionRef.current) {
      authorizeSubscriptionRef.current.unsubscribe();
    }

    authorizeSubscriptionRef.current = cantonBridge
      .authorizePreapproval(currency, device.deviceId, completedAccount, partyId)
      .subscribe({
        next: (data: CantonAuthorizeProgress | CantonAuthorizeResult) => {
          if ("status" in data) {
            setAuthorizeStatus(data.status);
          }
        },
        complete: () => {
          transitionTo(StepId.FINISH);
        },
        error: (err: AxiosError) => {
          logger.error("[handleAuthorizePreapproval] failed", err);
          setAuthorizeStatus(AuthorizeStatus.ERROR);
          setIsProcessing(false);
          setError(err);
        },
      });
  }, [onboardingResult, device, currency, cantonBridge, transitionTo]);

  invariant(device, "device is required");
  invariant(currency, "currency is required");
  invariant(creatableAccount, "creatableAccount is required");

  const stepperProps: StepProps = {
    t,
    device,
    currency,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isProcessing,
    onboardingResult,
    onboardingStatus,
    authorizeStatus,
    error,
    isReonboarding,
    onAddAccounts: handleAddAccounts,
    onAddMore: handleAddMore,
    onAuthorizePreapproval: handleAuthorizePreapproval,
    onOnboardAccount: handleOnboardAccount,
    onRetryOnboardAccount: handleRetryOnboardAccount,
    onRetryPreapproval: handleRetryPreapproval,
    transitionTo,
  };

  const renderStepContent = () => {
    switch (stepId) {
      case StepId.ONBOARD:
        return <StepOnboard {...stepperProps} />;
      case StepId.AUTHORIZE:
        return <StepAuthorize {...stepperProps} />;
      case StepId.FINISH:
        return <StepFinish {...stepperProps} />;
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (stepId) {
      case StepId.ONBOARD:
        return <StepOnboardFooter {...stepperProps} />;
      case StepId.AUTHORIZE:
        return <StepAuthorizeFooter {...stepperProps} />;
      case StepId.FINISH:
        return <StepFinishFooter {...stepperProps} />;
      default:
        return null;
    }
  };

  return (
    <Flex flexDirection="column" height="100%">
      <ScrollContainer>{renderStepContent()}</ScrollContainer>
      <Box px={24} py={16}>
        {renderFooter()}
      </Box>
    </Flex>
  );
}
