import React from "react";
import { MenuItem } from "@ledgerhq/lumen-ui-react";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

type Props = Readonly<{
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
}>;

export function Dust({
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
}: Props) {
  const { t } = useTranslation();
  const dustFilterLabel = hideSmallValueTokenOperations
    ? t("history.actionsBar.showDustTransactions")
    : t("history.actionsBar.hideDustTransactions");
  const dustFilterDescription = hideSmallValueTokenOperations
    ? t("history.actionsBar.dustTransactionsDisplayedDescription", {
        threshold: dustFilterThreshold,
      })
    : t("history.actionsBar.dustTransactionsDescription", {
        threshold: dustFilterThreshold,
      });
  const DustFilterIcon = hideSmallValueTokenOperations ? Eye : EyeCross;

  return (
    <MenuItem
      className="cursor-pointer"
      onClick={onToggleHideSmallValueTokenOperations}
      data-testid="history-toggle-dust-filter-button"
    >
      <DustFilterIcon size={20} className="shrink-0" />
      <span className="flex flex-col">
        <span>{dustFilterLabel}</span>
        <span className="body-3 text-muted">{dustFilterDescription}</span>
      </span>
    </MenuItem>
  );
}
