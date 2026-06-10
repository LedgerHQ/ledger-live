import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { ArcGaugeIndicator } from "LLD/components/ArcGaugeIndicator";
import { AltSeasonIndexDialog } from "./AltSeasonIndexDialog";

const BITCOIN_COLOR = "#FF9416";
const ALTCOIN_COLOR = "#3F51B5";

type AltSeasonIndexCardViewProps = {
  value: number;
  label: string;
  onClick: () => void;
};

export const AltSeasonIndexCardView = ({ value, label, onClick }: AltSeasonIndexCardViewProps) => {
  const { t } = useTranslation();

  return (
    <AltSeasonIndexDialog>
      <Card type="interactive" onClick={onClick} data-testid="alt-season-index-card">
        <CardHeader>
          <CardLeading>
            <CardContent>
              <CardContentTitle>
                <span className="body-3">{t("market.topCards.altSeason.title")}</span>
              </CardContentTitle>
              <CardContentDescription>
                <span className="body-1-semi-bold text-base">{t(label)}</span>
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <ArcGaugeIndicator value={value} startColor={BITCOIN_COLOR} endColor={ALTCOIN_COLOR} />
          </CardTrailing>
        </CardHeader>
      </Card>
    </AltSeasonIndexDialog>
  );
};
