import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Link,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";
import type { HistoryExportAccount } from "../../../model/ports";
import { ExportAccountListItem } from "./ExportAccountListItem";

type ExportSceneProps = Readonly<{
  accounts: readonly HistoryExportAccount[];
  checkedIds: string[];
  allSelected: boolean;
  toggleAccount: (id: string) => void;
  onSelectAllToggle: () => void;
}>;

export function ExportScene({
  accounts,
  checkedIds,
  allSelected,
  toggleAccount,
  onSelectAllToggle,
}: ExportSceneProps) {
  const { t } = useTranslation();
  const footerInset = useBottomSheetFooterInset();
  const count = accounts.length;

  return (
    <BottomSheetScrollView>
      <Box style={{ paddingBottom: footerInset }} testID="history-export-dialog">
        <BottomSheetHeader density="expanded" title={t("history.exportDialog.title")} />
        <Box lx={{ flexDirection: "column", gap: "s16" }}>
          <Banner appearance="warning" description={t("history.exportDialog.disclaimer")} />
          <Subheader>
            <SubheaderRow lx={{ justifyContent: "space-between" }}>
              <SubheaderTitle>{t("history.exportDialog.accountsToInclude")}</SubheaderTitle>
              <Link
                appearance="accent"
                size="md"
                underline={false}
                onPress={onSelectAllToggle}
                testID="history-export-select-all"
              >
                {allSelected
                  ? t("history.exportDialog.deselectAll", { count })
                  : t("history.exportDialog.selectAll", { count })}
              </Link>
            </SubheaderRow>
          </Subheader>
          <Box>
            {accounts.map(account => (
              <ExportAccountListItem
                key={account.id}
                account={account}
                checked={checkedIds.includes(account.id)}
                onToggle={() => toggleAccount(account.id)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </BottomSheetScrollView>
  );
}
