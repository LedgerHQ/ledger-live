import React from "react";
import { useTranslation } from "react-i18next";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Button,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";

export type BorrowEntryPointViewProps = {
  onClick: () => void;
};

export function BorrowEntryPointView({ onClick }: BorrowEntryPointViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-12" data-testid="portfolio-borrow-entry-point">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("portfolio.borrowEntry.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Card>
        <CardHeader>
          <CardLeading>
            <Spot appearance="icon" icon={Wallet} />
            <CardContent>
              <CardContentTitle>{t("portfolio.borrowEntry.cardTitle")}</CardContentTitle>
              <CardContentDescription>
                {t("portfolio.borrowEntry.cardDescription")}
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <Button appearance="base" size="sm" onClick={onClick}>
              {t("portfolio.borrowEntry.cta")}
            </Button>
          </CardTrailing>
        </CardHeader>
      </Card>
    </div>
  );
}
