import React from "react";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { HandCoins } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

interface PortfolioBorrowSectionProps {
  onPress: () => void;
}

export const PortfolioBorrowSection = ({ onPress }: PortfolioBorrowSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        paddingTop: "s32",
        paddingHorizontal: "s16",
      }}
    >
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle>{t("portfolio.borrowEntry.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ marginTop: "s8" }}>
        <Card onPress={onPress} testID="portfolio-borrow-entry-point">
          <CardHeader>
            <CardLeading>
              <Spot appearance="icon" icon={HandCoins} />
              <CardContent>
                <CardContentTitle>{t("portfolio.borrowEntry.cardTitle")}</CardContentTitle>
                <CardContentDescription>
                  {t("portfolio.borrowEntry.cardDescription")}
                </CardContentDescription>
              </CardContent>
            </CardLeading>
            <CardTrailing>
              <Button appearance="base" size="sm" onPress={onPress} testID="borrow-explore-cta">
                {t("portfolio.borrowEntry.cta")}
              </Button>
            </CardTrailing>
          </CardHeader>
        </Card>
      </Box>
    </Box>
  );
};
