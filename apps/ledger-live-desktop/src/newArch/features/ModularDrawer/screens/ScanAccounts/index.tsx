import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { TrackAddAccountScreen } from "LLD/features/ModularDrawer/analytics/TrackAddAccountScreen";
import { default as React, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";
import { ScrollContainer } from "../../components/ScrollContainer";
import { useFormatAccount } from "../../hooks/useFormatAccount";
import { useScanAccounts, type UseScanAccountsProps } from "../../hooks/useScanAccounts";
import { CreatableAccountsList } from "./components/CreatableAccountsList";
import { Footer } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";

interface Props extends UseScanAccountsProps {
  analyticsPropertyFlow?: string;
  onRetry?: () => void;
  source: string;
}

const ScanAccounts = ({
  currency,
  deviceId,
  source,
  onComplete,
  navigateToWarningScreen,
  onRetry,
}: Props) => {
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);
  const { t } = useTranslation();

  const {
    allImportableAccountsSelected,
    creatableAccounts,
    error,
    handleConfirm,
    handleDeselectAll,
    handleSelectAll,
    handleToggle,
    importableAccounts,
    newAccountSchemes,
    scanning,
    selectedIds,
    showAllCreatedAccounts,
    stopSubscription,
    toggleShowAllCreatedAccounts,
  } = useScanAccounts({
    currency,
    deviceId,
    navigateToWarningScreen,
    onComplete,
  });

  const formatAccount = useFormatAccount(currency);

  const renderAccount = useCallback(
    (account: Account) => {
      const accountFormatted = formatAccount(account);
      return (
        <Box mb={16} key={account.id}>
          <AccountItem
            account={accountFormatted}
            backgroundColor={colors.opacityDefault.c05}
            rightElement={{
              type: "checkbox",
              checkbox: {
                name: "checked",
                isChecked: selectedIds.includes(accountFormatted.id),
                onChange: () => {},
              },
            }}
            onClick={() => handleToggle(accountFormatted.id)}
          />
        </Box>
      );
    },
    [colors.opacityDefault.c05, formatAccount, handleToggle, selectedIds],
  );

  if (error) {
    return <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />;
  }

  return (
    <>
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS}
        source={source}
        flow={ADD_ACCOUNT_FLOW_NAME}
      />
      {scanning ? <LoadingOverlay theme={currentTheme || "dark"} /> : null}
      <Flex marginBottom={24}>
        <Text
          color="palette.text.shade100"
          data-testid="scan-accounts-title"
          flex={1}
          fontSize={24}
          lineHeight="32.4px"
          textAlign="left"
          width="100%"
        >
          {scanning
            ? t("modularAssetDrawer.scanAccounts.title")
            : t("modularAssetDrawer.addAccounts.title")}
        </Text>
      </Flex>

      <ScrollContainer>
        {importableAccounts.length > 0 ? (
          <ImportableAccountsList
            allImportableAccountsSelected={allImportableAccountsSelected}
            handleDeselectAll={handleDeselectAll}
            handleSelectAll={handleSelectAll}
            importableAccounts={importableAccounts}
            renderAccount={renderAccount}
            scanning={scanning}
          />
        ) : null}
        {!scanning && creatableAccounts.length > 0 ? (
          <CreatableAccountsList
            creatableAccounts={creatableAccounts}
            currency={currency}
            newAccountSchemes={newAccountSchemes}
            renderAccount={renderAccount}
            showAllCreatedAccounts={showAllCreatedAccounts}
            toggleShowAllCreatedAccounts={toggleShowAllCreatedAccounts}
          />
        ) : null}
      </ScrollContainer>
      <Footer
        handleConfirm={handleConfirm}
        importableAccounts={importableAccounts}
        scanning={scanning}
        selectedIds={selectedIds}
        stopSubscription={stopSubscription}
      />
    </>
  );
};

export default ScanAccounts;
