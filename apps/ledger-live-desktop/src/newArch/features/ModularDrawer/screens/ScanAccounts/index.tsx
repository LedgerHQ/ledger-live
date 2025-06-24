import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { default as React } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY, WarningReason } from "../../types";
import { useTheme } from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { Footer } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";
import { CreatableAccountsList } from "./components/CreatableAccountsList";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { useFormatAccount } from "./hooks/useFormatAccount";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useScanAccounts } from "./hooks/useScanAccounts";

interface Props {
  analyticsPropertyFlow?: string;
  currency: CryptoCurrency;
  onComplete: (accounts: Account[]) => void;
  deviceId: string;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
}

const ScanAccounts = ({
  currency,
  deviceId,
  onComplete,
  navigateToWarningScreen,
}: Props & { deviceId: string }) => {
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);
  const { t } = useTranslation();

  const {
    error,
    stopSubscription,
    toggleShowAllCreatedAccounts,
    newAccountSchemes,
    allImportableAccountsSelected,
    selectedIds,
    handleToggle,
    scanning,
    importableAccounts,
    handleSelectAll,
    handleDeselectAll,
    creatableAccounts,
    showAllCreatedAccounts,
    handleConfirm,
  } = useScanAccounts({ currency, deviceId, onComplete, navigateToWarningScreen });

  const { formatAccount } = useFormatAccount({ currency });

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
    return <ErrorDisplay error={error} withExportLogs />;
  }

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currency.name}
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
        scanning={scanning}
        selectedIds={selectedIds}
        stopSubscription={stopSubscription}
        handleConfirm={handleConfirm}
      />
    </>
  );
};

export default ScanAccounts;
