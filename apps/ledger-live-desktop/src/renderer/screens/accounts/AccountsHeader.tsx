import React from "react";
import { useTranslation } from "react-i18next";
import IconPlus from "~/renderer/icons/Plus";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import OptionsButton from "./OptionsButton";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_EVENTS_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { useFeature } from "@features/platform-feature-flags";
import PageHeader from "LLD/components/PageHeader";

const AccountsHeader = () => {
  const { t } = useTranslation();
  const { trackAddAccountEvent } = useAddAccountAnalytics();
  const ledgerSyncOptimisationFlag = useFeature("lwdLedgerSyncOptimisation");
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.ACCOUNTS_PAGE,
  );

  const handleAddAccountClick = () => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Add account",
      page: "Accounts",
    });
    openAssetFlow();
  };

  return (
    <div className="flex items-start justify-between pb-24">
      <PageHeader title={t("accounts.title")} />
      <div className="flex items-center gap-8">
        {!ledgerSyncOptimisationFlag?.enabled && (
          <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} />
        )}
        <Button
          small
          primary
          onClick={handleAddAccountClick}
          data-testid="accounts-add-account-button"
        >
          <Box horizontal flow={1} alignItems="center">
            <IconPlus size={12} />
            <Box>{t("addAccounts.cta.add")}</Box>
          </Box>
        </Button>
        <OptionsButton />
      </div>
    </div>
  );
};
export default React.memo(AccountsHeader);
