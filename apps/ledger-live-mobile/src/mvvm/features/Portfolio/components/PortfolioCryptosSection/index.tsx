import React from "react";
import {
  Box,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import Assets from "~/screens/Portfolio/Assets";
import { useTranslation } from "~/context/Locale";
import { Asset } from "~/types/asset";

interface PortfolioCryptosSectionProps {
  readonly assets: Asset[];
  readonly onPressShowAll: () => void;
}

export const PortfolioCryptosSection = ({
  assets,
  onPressShowAll,
}: PortfolioCryptosSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box key="cryptos">
      <Subheader>
        <SubheaderRow
          onPress={onPressShowAll}
          lx={{ marginBottom: "s12" }}
          accessibilityRole="button"
        >
          <SubheaderTitle>{`${t("wallet.tabs.crypto")} (${String(assets.length)})`}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      <Assets assets={assets} />
      <Button
        appearance="gray"
        size="lg"
        isFull
        onPress={onPressShowAll}
        lx={{ marginTop: "s24", marginBottom: "s48" }}
      >
        {t("portfolio.seeAllAssets")}
      </Button>
    </Box>
  );
};
