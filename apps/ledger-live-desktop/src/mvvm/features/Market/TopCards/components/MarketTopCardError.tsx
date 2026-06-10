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
import { useTranslation } from "react-i18next";

type MarketTopCardErrorProps = {
  readonly testId: string;
  readonly titleKey: string;
  readonly hasTrailing?: boolean;
};

export function MarketTopCardError({
  testId,
  titleKey,
  hasTrailing = true,
}: MarketTopCardErrorProps) {
  const { t } = useTranslation();

  const errorMessage = (
    <span className="body-1-semi-bold text-base">{t("market.topCards.error")}</span>
  );

  return (
    <Card className="w-full" data-testid={testId}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>
              <span className="body-3">{t(titleKey)}</span>
            </CardContentTitle>
            <CardContentDescription>
              {hasTrailing ? (
                errorMessage
              ) : (
                <div className="flex items-center gap-8">
                  <Spot appearance="icon" icon={Warning} size={40} />
                  {errorMessage}
                </div>
              )}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        {hasTrailing ? (
          <CardTrailing>
            <Spot appearance="icon" icon={Warning} size={48} />
          </CardTrailing>
        ) : null}
      </CardHeader>
    </Card>
  );
}
