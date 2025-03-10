import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconPlus from "~/renderer/icons/Plus";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import OptionsButton from "./OptionsButton";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";

const AccountsHeader = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const openAddAccounts = useCallback(() => {
    dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
  }, [dispatch]);
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
        <Button small primary onClick={openAddAccounts} data-testid="accounts-add-account-button">
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
