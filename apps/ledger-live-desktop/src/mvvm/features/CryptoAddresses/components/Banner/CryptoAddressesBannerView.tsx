import React, { memo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Spot,
  Button,
  MediaImageGroup,
} from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import type { CryptoAddressesBannerViewModelResult } from "./hooks/useCryptoAddressesBannerViewModel";

const BANNER_CURRENCY_ICON_SIZE = 16;

export const CryptoAddressesBannerView = memo(function CryptoAddressesBannerView({
  title,
  description,
  icon: Icon,
  onGoToAccounts,
  onAddAccount,
  buttonText,
  firstThreeCurrencies,
}: CryptoAddressesBannerViewModelResult) {
  const handleClick = useCallback(() => {
    if (buttonText) {
      onAddAccount();
    } else {
      onGoToAccounts();
    }
  }, [buttonText, onGoToAccounts, onAddAccount]);

  return (
    <Card data-testid="crypto-addresses-banner" onClick={handleClick}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Icon} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <div className="flex items-center gap-4">
              <CardContentDescription>{description}</CardContentDescription>
              <MediaImageGroup
                data={firstThreeCurrencies}
                size={BANNER_CURRENCY_ICON_SIZE}
                shape="square"
                maxVisible={3}
                renderItem={(currency, { size }) => (
                  <SquaredCryptoIcon
                    size={size}
                    ledgerId={currency.id}
                    ticker={currency.ticker}
                    {...(currency.type === "TokenCurrency" && {
                      network: currency.parentCurrencyId,
                    })}
                  />
                )}
              />
            </div>
          </CardContent>
        </CardLeading>
        {buttonText && (
          <CardTrailing>
            <Button
              appearance="base"
              size="sm"
              data-testid="crypto-addresses-banner-add-account-cta"
              onClick={e => {
                e.stopPropagation();
                onAddAccount?.();
              }}
            >
              {buttonText}
            </Button>
          </CardTrailing>
        )}
      </CardHeader>
    </Card>
  );
});
