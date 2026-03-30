import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";

export const AllocationSubheader = () => {
  const { t } = useTranslation();
  return (
    <Subheader>
      <SubheaderRow>
        <SubheaderTitle>{t("analytics.allocation.title")}</SubheaderTitle>
      </SubheaderRow>
    </Subheader>
  );
};
