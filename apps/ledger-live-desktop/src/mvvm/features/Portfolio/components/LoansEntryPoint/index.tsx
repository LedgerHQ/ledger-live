import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";

export const LoansEntryPoint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate("/borrow");
  }, [navigate]);

  return (
    <div className="flex flex-col gap-12" data-testid="portfolio-loans-entry-point">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("portfolio.loansEntry.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Card onClick={handleClick}>
        <CardHeader>
          <CardLeading>
            <Spot appearance="icon" icon={Wallet} />
            <CardContent>
              <CardContentTitle>{t("portfolio.loansEntry.cardTitle")}</CardContentTitle>
              <CardContentDescription>
                {t("portfolio.loansEntry.cardDescription")}
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <Button appearance="base" size="sm" onClick={handleClick}>
              {t("portfolio.loansEntry.cta")}
            </Button>
          </CardTrailing>
        </CardHeader>
      </Card>
    </div>
  );
};
