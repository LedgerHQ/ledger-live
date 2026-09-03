import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export const UNAVAILABLE_SECTION_HEADER_HEIGHT = 48;

export const UnavailableSectionHeader = ({ testId }: Readonly<{ testId?: string }>) => {
  const { t } = useTranslation();

  return (
    <Subheader className="h-full justify-end px-8 pb-8" data-testid={testId}>
      <SubheaderRow>
        <SubheaderTitle as="h3">{t("modularAssetDrawer.notAvailableYet")}</SubheaderTitle>
      </SubheaderRow>
    </Subheader>
  );
};
