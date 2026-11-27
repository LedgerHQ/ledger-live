import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

type Props = Readonly<{
  tokens: TokenCurrency[];
  className?: string;
}>;

export function FrozenTokensBanner({ tokens, className }: Props) {
  const { t } = useTranslation();
  const learnMoreUrl = useLocalizedUrl(urls.xrp.learnMore);

  if (tokens.length === 0) return null;

  const count = tokens.length;

  const tickers = tokens.map(token => token.ticker).join(", ");

  return (
    <Banner
      className={className}
      appearance="warning"
      title={t("xrp.frozenBanner.title", { count, tickers })}
      description={t("xrp.frozenBanner.description", { count })}
      primaryAction={
        <Button
          appearance="gray"
          size="sm"
          icon={ExternalLink}
          onClick={() => openURL(learnMoreUrl)}
        >
          {t("common.learnMore")}
        </Button>
      }
      data-testid="xrp-frozen-tokens-banner"
    />
  );
}
