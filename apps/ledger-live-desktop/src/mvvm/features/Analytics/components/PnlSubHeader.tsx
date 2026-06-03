import { Link, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";

type PnlSubHeaderProps = Readonly<{
  onDetailClick: () => void;
}>;

export const PnlSubHeader = ({ onDetailClick }: PnlSubHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Subheader>
      <div className="flex items-center gap-24">
        <SubheaderRow className="min-w-0 flex-1">
          <SubheaderTitle>{t("analytics.pnl.title")}</SubheaderTitle>
        </SubheaderRow>
        <Link
          appearance="accent"
          underline={false}
          size="md"
          onClick={onDetailClick}
          className="cursor-pointer"
        >
          {t("pnl.portfolio.detail")}
        </Link>
      </div>
    </Subheader>
  );
};
