import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { default as React, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useTheme } from "styled-components";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ScrollContainer } from "../../components/ScrollContainer";
import { FormattedAccountItem } from "../../components/FormattedAccountItem";
import { CreatableAccountsList } from "./components/CreatableAccountsList";
import { Footer, type FooterProps } from "./components/Footer";
import { ImportableAccountsList } from "./components/ImportableAccountsList";
import { useFormatAccount } from "./useFormatAccount";
import { useScanAccounts, type UseScanAccountsProps } from "./useScanAccounts";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";

interface Props extends UseScanAccountsProps {
  analyticsPropertyFlow?: string;
  deferAccountAddition?: boolean;
  onRetry?: () => void;
  FooterComponent?: React.ComponentType<FooterProps>;
}

const ScanAccounts = ({
  currency,
  deviceId,
  deferAccountAddition,
  onComplete,
  navigateToWarningScreen,
  onRetry,
  FooterComponent = Footer,
}: Props) => {
  const source = useSelector(modularDrawerSourceSelector);
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);
  const { t } = useTranslation();

  const {
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
    deferAccountAddition,
    navigateToWarningScreen,
    onComplete,
  });

  const formatAccount = useFormatAccount(currency);

  const renderAccount = useCallback(
    (account: Account) => {
      const accountFormatted = formatAccount(account);
      return (
        <Box mb={16} key={account.id}>
          <FormattedAccountItem
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
          color="neutral.c100"
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
            handleDeselectAll={handleDeselectAll}
            handleSelectAll={handleSelectAll}
            importableAccounts={importableAccounts}
            renderAccount={renderAccount}
            selectedIds={selectedIds}
            scanning={scanning}
          />
        ) : null}
        {!scanning && creatableAccounts.length > 0 ? (
          <>
            <TrackAddAccountScreen
              page={ADD_ACCOUNT_PAGE_NAME.SELECT_ACCOUNT_TO_ADD}
              source={source}
              flow={ADD_ACCOUNT_FLOW_NAME}
            />
            <CreatableAccountsList
              creatableAccounts={creatableAccounts}
              currency={currency}
              newAccountSchemes={newAccountSchemes}
              renderAccount={renderAccount}
              showAllCreatedAccounts={showAllCreatedAccounts}
              toggleShowAllCreatedAccounts={toggleShowAllCreatedAccounts}
            />
          </>
        ) : null}
      </ScrollContainer>
      <FooterComponent
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
