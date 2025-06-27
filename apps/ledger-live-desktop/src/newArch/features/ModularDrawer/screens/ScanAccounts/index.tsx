import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { default as React } from "react";
import { useTheme } from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { useScanAccounts, type UseScanAccountsProps } from "../../hooks/useScanAccounts";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { Footer } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";
import { CreatableAccountsList } from "./components/CreatableAccountsList";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { TrackAddAccountScreen } from "LLD/features/ModularDrawer/analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";

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
    newAccountSchemes,
    scanning,
    error,
    importableAccounts,
    creatableAccounts,
    selectedIds,
    showAllCreatedAccounts,
    stopSubscription,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    handleConfirm,
    toggleShowAllCreatedAccounts,
    allImportableAccountsSelected,
    formatAccount,
  } = useScanAccounts({
    navigateToWarningScreen,
    currency,
    deviceId,
    onComplete,
  });

  const renderAccount = (account: Account) => {
    const accountFormatted = formatAccount(account);
    return (
      <Box mb={16} key={account.id}>
        <AccountItem
          account={accountFormatted}
          rightElement={{
            type: "checkbox",
            checkbox: {
              name: "checked",
              isChecked: selectedIds.includes(accountFormatted.id),
              onChange: () => {},
            },
          }}
          onClick={() => handleToggle(accountFormatted.id)}
          backgroundColor={colors.opacityDefault.c05}
        />
      </Box>
    );
  };

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
      <Flex width="100%" alignItems="center">
        <Text
          fontSize={24}
          flex={1}
          textAlign="left"
          width="100%"
          lineHeight="32.4px"
          color="palette.text.shade100"
          data-testid="scan-accounts-title"
        >
          {scanning
            ? t("modularAssetDrawer.scanAccounts.title")
            : t("modularAssetDrawer.addAccounts.title")}
        </Text>
      </Flex>

      <Flex flex={1} flexDirection="column" overflow="auto">
        {importableAccounts.length > 0 ? (
          <ImportableAccountsList
            scanning={scanning}
            importableAccounts={importableAccounts}
            allImportableAccountsSelected={allImportableAccountsSelected}
            handleSelectAll={handleSelectAll}
            handleDeselectAll={handleDeselectAll}
            renderAccount={renderAccount}
          />
        ) : null}
        {!scanning && creatableAccounts.length > 0 ? (
          <CreatableAccountsList
            currency={currency}
            newAccountSchemes={newAccountSchemes}
            creatableAccounts={creatableAccounts}
            showAllCreatedAccounts={showAllCreatedAccounts}
            toggleShowAllCreatedAccounts={toggleShowAllCreatedAccounts}
            renderAccount={renderAccount}
          />
        ) : null}
      </Flex>
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
