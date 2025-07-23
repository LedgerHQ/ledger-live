import { Box, Flex, Link, Text } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";

export type ImportableAccountsListProps = {
  scanning: boolean;
  importableAccounts: Account[];
  allImportableAccountsSelected: boolean;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  renderAccount: (account: Account) => React.ReactNode;
};

export const ImportableAccountsList = ({
  scanning,
  importableAccounts,
  allImportableAccountsSelected,
  handleSelectAll,
  handleDeselectAll,
  renderAccount,
}: ImportableAccountsListProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Box>
        <Flex alignItems="center" justifyContent="space-between" mb="2">
          <Text variant="h5Inter" fontSize="small" color="neutral.c80">
            {t(
              scanning
                ? "modularAssetDrawer.scanAccounts.status.scanning"
                : "modularAssetDrawer.scanAccounts.status.foundAccounts",
              { count: importableAccounts.length },
            )}
          </Text>
          {importableAccounts.length > 0 ? (
            allImportableAccountsSelected ? (
              <Link size="small" onClick={handleDeselectAll}>
                {t("modularAssetDrawer.addAccounts.controls.deselectAll")}
              </Link>
            ) : (
              <Link size="small" onClick={handleSelectAll}>
                {t("modularAssetDrawer.addAccounts.controls.selectAll")}
              </Link>
            )
          ) : null}
        </Flex>
      </Box>
      <Box>{importableAccounts.map(renderAccount)}</Box>
    </>
  );
};
