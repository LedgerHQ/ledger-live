import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { TrackAddAccountScreen } from "LLD/features/ModularDrawer/analytics/TrackAddAccountScreen";
import { default as React } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";
import { ScrollContainer } from "../../components/ScrollContainer";
import { useScanAccounts, type UseScanAccountsProps } from "../../hooks/useScanAccounts";
import { CreatableAccountsList } from "./components/CreatableAccountsList";
import { Footer } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";
import { useFormatAccount } from "../../hooks/useFormatAccount";

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
  } = useScanAccounts({
    navigateToWarningScreen,
    currency,
    deviceId,
    onComplete,
  });

  const formatAccount = useFormatAccount({ currency });

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
      <Flex marginBottom={24}>
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

      <ScrollContainer>
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
