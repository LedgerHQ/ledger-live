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
} from "@ledgerhq/lumen-ui-react";
import type { CryptoAddressesBannerViewModelResult } from "./hooks/useCryptoAddressesBannerViewModel";
import { IconsList } from "./components/IconsList";

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
    if (!buttonText) {
      onGoToAccounts?.();
    }
  }, [buttonText, onGoToAccounts]);

  return (
    <Card data-testid="crypto-addresses-banner" onClick={handleClick}>
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={Icon} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <div className="flex items-center gap-4">
              <CardContentDescription>{description}</CardContentDescription>
              <IconsList currencies={firstThreeCurrencies} />
            </div>
          </CardContent>
        </CardLeading>
        {buttonText && (
          <CardTrailing>
            <Button appearance="base" size="sm" onClick={onAddAccount}>
              {buttonText}
            </Button>
          </CardTrailing>
        )}
      </CardHeader>
    </Card>
  );
});
