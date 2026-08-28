import React from "react";
import {
  Button,
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Chart2 } from "@ledgerhq/lumen-ui-rnative/symbols";
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
    <ContentBanner>
      <Spot appearance="icon" icon={Chart2} size={48} />
      <ContentBannerContent>
        <ContentBannerTitle>{title}</ContentBannerTitle>
        <ContentBannerDescription>{description}</ContentBannerDescription>
      </ContentBannerContent>
      <Button appearance="base" size="sm" onPress={onExplore}>
        {buttonLabel}
      </Button>
    </ContentBanner>
  );
}
