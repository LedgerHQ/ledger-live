import React from "react";
import { useTranslation } from "react-i18next";
import IconPlus from "~/renderer/icons/Plus";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import OptionsButton from "./OptionsButton";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_EVENTS_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";

const AccountsHeader = () => {
  const { t } = useTranslation();
  const { trackAddAccountEvent } = useAddAccountAnalytics();
  const { openAssetFlow } = useOpenAssetFlow(
    ModularDrawerLocation.ADD_ACCOUNT,
    MAD_SOURCE_PAGES.ACCOUNTS_PAGE,
  );

  const handleAddAccountClick = () => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Add account",
      page: "Accounts",
    });
    openAssetFlow(true);
  };
  return (
    <Box
      horizontal
      style={{
        paddingBottom: 32,
      }}
    >
      <Box grow ff="Inter|SemiBold" fontSize={7} color="palette.text.shade100" id="accounts-title">
        {t("accounts.title")}
      </Box>
      <Box horizontal flow={2} alignItems="center" justifyContent="flex-end">
        <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} />
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
      </Box>
    </Box>
  );
};
export default React.memo<{}>(AccountsHeader);
