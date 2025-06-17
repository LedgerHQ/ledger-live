import { Box, Flex } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { default as React } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Title } from "../../components/Header/Title";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { useTheme } from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { useScanAccounts } from "../../hooks/useScanAccounts";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { Footer } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";
import { CreatableAccountsList } from "./components/CreatableAccountsList";

interface Props {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (_: Account[]) => void;
  analyticsPropertyFlow?: string;
}

const ScanAccounts = ({ currency, deviceId, onComplete }: Props) => {
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);

  const {
    newAccountSchemes,
    scanning,
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
          checkbox={{
            name: "checked",
            isChecked: selectedIds.includes(accountFormatted.id),
            onChange: () => {},
          }}
          onClick={() => handleToggle(accountFormatted.id)}
          backgroundColor={colors.opacityDefault.c05}
        />
      </Box>
    );
  };

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currency.name}
      />
      {scanning ? <LoadingOverlay theme={currentTheme || "dark"} /> : null}
      <Title
        translationKey={
          scanning
            ? "modularAssetDrawer.scanAccounts.title"
            : "modularAssetDrawer.addAccounts.title"
        }
      />
      <Flex flex={1} flexDirection="column" overflow="auto">
        {importableAccounts.length > 0 && creatableAccounts.length === 0 ? (
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
