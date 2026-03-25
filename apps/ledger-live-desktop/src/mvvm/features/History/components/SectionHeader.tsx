import React from "react";
import { TableGroupHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

type SectionHeaderProps = {
  readonly labelKey: string;
  readonly count: number;
  readonly columnCount: number;
};

export function SectionHeader({ labelKey, count, columnCount }: SectionHeaderProps) {
  const { t } = useTranslation();
  return <TableGroupHeaderRow colSpan={columnCount}>{t(labelKey, { count })}</TableGroupHeaderRow>;
}
