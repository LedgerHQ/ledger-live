import React from "react";
import {
  Button,
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Chart2 } from "@ledgerhq/lumen-ui-react/symbols";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useEarnBannerViewModel } from "../../hooks/useEarnBannerViewModel";

type EarnBannerProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  provider?: string;
}>;

export function EarnBanner({ sendCurrency, receiveCurrency, provider }: EarnBannerProps) {
  const { isVisible, title, description, buttonLabel, onExplore } = useEarnBannerViewModel({
    sendCurrency,
    receiveCurrency,
    provider,
  });

  if (!isVisible || !title) {
    return null;
  }

  return (
    <ContentBanner data-testid="swap-transaction-earn-banner">
      <Spot appearance="icon" icon={Chart2} size={48} />
      <ContentBannerContent>
        <ContentBannerTitle>{title}</ContentBannerTitle>
        <ContentBannerDescription>{description}</ContentBannerDescription>
      </ContentBannerContent>
      <Button appearance="base" size="sm" onClick={onExplore}>
        {buttonLabel}
      </Button>
    </ContentBanner>
  );
}
