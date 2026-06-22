import React, { type ReactNode } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  Box,
  IconButton,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { SettingsAlt2 } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

type Props = Readonly<{
  header?: ReactNode;
  showSubheader: boolean;
  onOpenFilters: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}>;

export function MarketAssetsListHeader({ header, showSubheader, onOpenFilters, onLayout }: Props) {
  const { t } = useTranslation();

  if (!header && !showSubheader) return null;

  return (
    <Box lx={headerStyle} onLayout={onLayout}>
      {header}
      {showSubheader ? (
        <Subheader lx={subHeaderStyle} testID={MARKET_SCREEN_TEST_IDS.assetsSubHeader}>
          <SubheaderRow lx={subHeaderRowStyle}>
            <SubheaderTitle>{t("market.assets.title")}</SubheaderTitle>
            <IconButton
              accessibilityLabel={t("market.assets.filters.accessibilityLabel")}
              appearance="no-background"
              icon={SettingsAlt2}
              onPress={onOpenFilters}
              size="sm"
              testID={MARKET_SCREEN_TEST_IDS.assetsFilterButton}
            />
          </SubheaderRow>
        </Subheader>
      ) : null}
    </Box>
  );
}

const headerStyle: LumenViewStyle = {
  marginHorizontal: "-s16",
  paddingTop: "s6",
  paddingBottom: "s12",
  gap: "s24",
};

const subHeaderStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

const subHeaderRowStyle: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "space-between",
};
