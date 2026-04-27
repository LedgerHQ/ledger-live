import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
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

export const BorrowEntryPoint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate("/borrow", { state: { returnTo: location.pathname } });
  }, [navigate, location.pathname]);

  return (
    <div className="flex flex-col gap-12" data-testid="portfolio-borrow-entry-point">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("portfolio.borrowEntry.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Card onClick={handleClick}>
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
            <Button appearance="base" size="sm" onClick={handleClick}>
              {t("portfolio.borrowEntry.cta")}
            </Button>
          </CardTrailing>
        </CardHeader>
      </Card>
    </div>
  );
};
