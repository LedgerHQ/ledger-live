import React from "react";
import { Subheader, Link, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

type ExportAccountsHeaderProps = Readonly<{
  allSelected: boolean;
  count: number;
  onToggle: () => void;
}>;

export function ExportAccountsHeader({ allSelected, count, onToggle }: ExportAccountsHeaderProps) {
  const { t } = useTranslation();

  return (
    <Subheader>
      <div className="flex items-center gap-24">
        <SubheaderRow className="min-w-0 flex-1">
          <SubheaderTitle>{t("history.exportDialog.accountsToInclude")}</SubheaderTitle>
        </SubheaderRow>
        <Link appearance="accent" underline={false} size="md" onClick={onToggle}>
          {allSelected
            ? t("history.exportDialog.deselectAll", { count })
            : t("history.exportDialog.selectAll", { count })}
        </Link>
      </div>
    </Subheader>
  );
}
