import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export const UnavailableSectionHeader = ({ testID }: Readonly<{ testID?: string }>) => {
  const { t } = useTranslation();

  return (
    <Subheader lx={{ paddingTop: "s16", paddingBottom: "s8" }} testID={testID}>
      <SubheaderRow>
        <SubheaderTitle>{t("modularDrawer.notAvailableYet")}</SubheaderTitle>
      </SubheaderRow>
    </Subheader>
  );
};
