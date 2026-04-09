import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Alert, Box, Button, Flex, Text } from "@ledgerhq/react-ui";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useMemo } from "react";
import { Trans } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { ScrollContainer } from "LLD/features/AddAccountDrawer/components/ScrollContainer";
import { FormattedAccountItem } from "LLD/features/AddAccountDrawer/components/FormattedAccountItem";
import { CreatableAccountsList } from "LLD/features/AddAccountDrawer/screens/ScanAccounts/components/CreatableAccountsList";
import { useFormatAccount } from "LLD/features/AddAccountDrawer/screens/ScanAccounts/useFormatAccount";
import {
  FOOTER_PADDING_BOTTOM_PX,
  FOOTER_PADDING_TOP_PX,
} from "LLD/features/AddAccountDrawer/screens/styles";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useOnboardingState } from "./hooks/useOnboardingState";
import { useCantonBridge } from "./hooks/useCantonBridge";
import {
  prepareAccountsForNewOnboarding,
  prepareAccountsForReonboarding,
  getImportableAccounts,
} from "./utils/accountPreparation";
import { TransactionConfirm } from "./components/TransactionConfirm";

interface CantonOnboardProps {
  currency: CryptoCurrency;
  selectedAccounts: Account[];
  onComplete: (accounts: Account[]) => void;
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  editedNames?: { [accountId: string]: string };
}

const AccountItemWrapper = styled(Box)`
  border-radius: 12px;
  padding: 16px;
`;

export default function CantonOnboard({
  currency,
  selectedAccounts,
  onComplete,
  isReonboarding = false,
  accountToReonboard,
  editedNames = {},
}: CantonOnboardProps) {
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);
  const device = useSelector(getCurrentDevice) as Device | null;
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const bridge = useMemo(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    () => getCurrencyBridge(currency) as CantonCurrencyBridge,
    [currency],
  );

  const {
    onboardingStatus,
    onboardingResult,
    error,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    resetOnboarding,
  } = useOnboardingState();

  const accountToOnboard = useMemo(
    () =>
      isReonboarding && accountToReonboard
        ? accountToReonboard
        : selectedAccounts.find(
            account => isCantonAccount(account) && !account.cantonResources.isOnboarded,
          ),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const formatAccount = useFormatAccount(currency);

  const handleOnboardingComplete = useCallback(() => {
    // No-op: transition to FINISH step is handled by the footer button
  }, []);

  const { startOnboarding, unsubscribe } = useCantonBridge({
    bridge,
    currency,
    device,
    accountToOnboard,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    onOnboardingComplete: handleOnboardingComplete,
  });

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const handleRetry = useCallback(() => {
    unsubscribe();
    resetOnboarding();
  }, [unsubscribe, resetOnboarding]);

  const handleAddAccounts = useCallback(() => {
    if (!onboardingResult) return;

    const { accounts, renamings } =
      isReonboarding && accountToReonboard
        ? prepareAccountsForReonboarding(
            accountToReonboard,
            onboardingResult.completedAccount,
            editedNames,
          )
        : prepareAccountsForNewOnboarding(
            importableAccounts,
            onboardingResult.completedAccount,
            editedNames,
          );

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(a => a.id),
        renamings,
      }),
    );

    onComplete(accounts);
  }, [
    onboardingResult,
    importableAccounts,
    existingAccounts,
    dispatch,
    onComplete,
    isReonboarding,
    accountToReonboard,
    editedNames,
  ]);

  const renderAccountItem = useCallback(
    (account: Account) => {
      const formatted = formatAccount(account);
      return (
        <Box mb={16} key={account.id}>
          <AccountItemWrapper backgroundColor={colors.opacityDefault.c05}>
            <FormattedAccountItem account={formatted} />
          </AccountItemWrapper>
        </Box>
      );
    },
    [formatAccount, colors.opacityDefault.c05],
  );

  const renderAccountsSection = () => (
    <Box>
      {importableAccounts.length > 0 && (
        <Box mb={4}>
          <Text variant="h5Inter" fontSize="small" color="neutral.c80" mb="2">
            <Trans
              i18nKey="families.canton.addAccount.onboard.onboarded"
              count={importableAccounts.length}
            />
          </Text>
          <Box>{importableAccounts.map(renderAccountItem)}</Box>
        </Box>
      )}

      {accountToOnboard && (
        <CreatableAccountsList
          creatableAccounts={[accountToOnboard]}
          currency={currency}
          newAccountSchemes={[]}
          showAllCreatedAccounts={false}
          toggleShowAllCreatedAccounts={() => {}}
          renderAccount={renderAccountItem}
        />
      )}
    </Box>
  );

  const renderOnboardContent = () => {
    switch (onboardingStatus) {
      case OnboardStatus.INIT:
        return (
          <Box>
            {renderAccountsSection()}
            <Box mt={2}>
              <Alert
                type={isReonboarding ? "warning" : "info"}
                containerProps={{ p: 12 }}
                renderContent={() => (
                  <Text
                    variant="paragraphLineHeight"
                    fontWeight="semiBold"
                    color="neutral.c100"
                    fontSize={13}
                  >
                    <Trans
                      i18nKey={
                        isReonboarding
                          ? "families.canton.addAccount.reonboard.init"
                          : "families.canton.addAccount.onboard.init"
                      }
                    />
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      case OnboardStatus.SIGN:
        return (
          <Flex alignItems="center" justifyContent="center" minHeight="100%" flexDirection="column">
            <TransactionConfirm device={device!} />
          </Flex>
        );

      case OnboardStatus.SUCCESS:
        return (
          <Box>
            {renderAccountsSection()}
            <Box mt={2}>
              <Alert
                type="success"
                containerProps={{ p: 12 }}
                renderContent={() => (
                  <Text
                    variant="paragraphLineHeight"
                    fontWeight="semiBold"
                    color="neutral.c100"
                    fontSize={13}
                  >
                    <Trans
                      i18nKey={
                        isReonboarding
                          ? "families.canton.addAccount.reonboard.success"
                          : "families.canton.addAccount.onboard.success"
                      }
                    />
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      case OnboardStatus.ERROR:
        return (
          <Box>
            {renderAccountsSection()}
            <Box mt={2}>
              <Alert
                type="error"
                containerProps={{ p: 12, borderRadius: "4px" }}
                renderContent={() => (
                  <Text variant="paragraphLineHeight" color="neutral.c80" fontSize={13}>
                    <Trans i18nKey="families.canton.addAccount.onboard.error" />
                  </Text>
                )}
              />
            </Box>
          </Box>
        );

      default:
        return (
          <Box>
            {renderAccountsSection()}
            <Flex
              alignItems="center"
              justifyContent="center"
              borderRadius="4px"
              px={3}
              mt={1}
              style={{
                height: "48px",
                border: "1px dashed",
                borderColor: "var(--palette-text-shade60)",
                borderRadius: "8px",
              }}
            >
              <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                <Trans i18nKey={getStatusMessage(onboardingStatus)} />
              </Text>
            </Flex>
          </Box>
        );
    }
  };

  const isProcessing =
    onboardingStatus === OnboardStatus.PREPARE || onboardingStatus === OnboardStatus.SUBMIT;

  const renderOnboardFooter = () => {
    if (onboardingStatus === OnboardStatus.SIGN) {
      return null;
    }

    if (onboardingStatus === OnboardStatus.SUCCESS) {
      return (
        <Button size="xl" variant="main" onClick={handleAddAccounts} flex={1}>
          <Trans i18nKey="common.continue" />
        </Button>
      );
    }

    if (onboardingStatus === OnboardStatus.ERROR) {
      return (
        <Button size="xl" variant="main" onClick={handleRetry} flex={1}>
          <Trans i18nKey="common.tryAgain" />
        </Button>
      );
    }

    return (
      <Button size="xl" variant="main" disabled={isProcessing} onClick={startOnboarding} flex={1}>
        <Trans i18nKey="common.continue" />
      </Button>
    );
  };

  return (
    <Flex flexDirection="column" height="100%">
      {onboardingStatus === OnboardStatus.PREPARE && (
        <LoadingOverlay theme={currentTheme || "dark"} />
      )}
      <ScrollContainer position="relative">
        {renderOnboardContent()}
      </ScrollContainer>
      <Box
        paddingBottom={FOOTER_PADDING_BOTTOM_PX}
        paddingTop={FOOTER_PADDING_TOP_PX}
        paddingX="0px"
        zIndex={1}
      >
        <Flex flexDirection="row" alignItems="center" justifyContent="flex-end" width="100%">
          {renderOnboardFooter()}
        </Flex>
      </Box>
    </Flex>
  );
}

function getStatusMessage(status: OnboardStatus): string {
  switch (status) {
    case OnboardStatus.PREPARE:
      return "families.canton.addAccount.onboard.status.prepare";
    case OnboardStatus.SUBMIT:
      return "families.canton.addAccount.onboard.status.submit";
    default:
      return "families.canton.addAccount.onboard.status.default";
  }
}
