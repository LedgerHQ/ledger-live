import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { Alert, Box, Button, Flex, Text } from "@ledgerhq/react-ui";
import type { Account } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { ScrollContainer } from "LLD/features/AddAccountDrawer/components/ScrollContainer";
import { FormattedAccountItem } from "LLD/features/AddAccountDrawer/components/FormattedAccountItem";
import { CreatableAccountsList } from "LLD/features/AddAccountDrawer/screens/ScanAccounts/components/CreatableAccountsList";
import {
  FOOTER_PADDING_BOTTOM_PX,
  FOOTER_PADDING_TOP_PX,
} from "LLD/features/AddAccountDrawer/screens/styles";
import { TransactionConfirm } from "./components/TransactionConfirm";
import type { CantonOnboardViewProps } from "./hooks/useCantonOnboardViewModel";

const AccountItemWrapper = styled(Box)`
  border-radius: 12px;
  padding: 16px;
`;

function CantonOnboardView({
  onboardingStatus,
  device,
  currentTheme,
  isReonboarding,
  isProcessing,
  importableAccounts,
  accountToOnboard,
  currency,
  formatAccount,
  colors,
  startOnboarding,
  handleRetry,
  handleAddAccounts,
}: Readonly<CantonOnboardViewProps>) {
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

export default CantonOnboardView;
