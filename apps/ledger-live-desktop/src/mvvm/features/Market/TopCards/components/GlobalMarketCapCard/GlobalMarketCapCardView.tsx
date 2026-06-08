import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  Trend,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { GlobalMarketCapDialog } from "./GlobalMarketCapDialog";

type GlobalMarketCapCardViewProps = {
  value: string;
  changePercentage?: number;
  onClick: () => void;
};

export const GlobalMarketCapCardView = ({
  value,
  changePercentage,
  onClick,
}: GlobalMarketCapCardViewProps) => {
  const { t } = useTranslation();

  return (
    <GlobalMarketCapDialog>
      <Card type="interactive" onClick={onClick} data-testid="global-market-cap-card">
        <CardHeader>
          <CardLeading>
            <CardContent>
              <CardContentTitle>
                <span className="body-3">{t("market.topCards.globalMarketCap.title")}</span>
              </CardContentTitle>
              <CardContentDescription>
                <div className="flex items-center gap-4">
                  <span className="body-1-semi-bold text-base">{value}</span>
                  {changePercentage !== undefined ? (
                    <>
                      <Trend value={changePercentage} size="md" />
                      <span className="body-2 text-muted">
                        · {t("market.topCards.globalMarketCap.period")}
                      </span>
                    </>
                  ) : null}
                </div>
              </CardContentDescription>
            </CardContent>
          </CardLeading>
        </CardHeader>
      </Card>
    </GlobalMarketCapDialog>
  );
};
