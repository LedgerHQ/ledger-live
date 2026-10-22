import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";

export function ErrorCard() {
  const { t } = useTranslation();

  return (
    <Card className="w-full" data-testid="market-top-card-2">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>
              <span className="body-3">{t("market.topCards.moodIndex.title")}</span>
            </CardContentTitle>
            <CardContentDescription>
              <span className="body-1-semi-bold text-base">{t("market.topCards.error")}</span>
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Spot icon={Warning} size={48} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
