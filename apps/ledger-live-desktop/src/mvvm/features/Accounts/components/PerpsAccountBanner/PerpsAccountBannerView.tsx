import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

type Props = Readonly<{
  isVisible: boolean;
  onOpenPerps: () => void;
}>;

export function PerpsAccountBannerView({ isVisible, onOpenPerps }: Props) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <Banner
      className="mb-24 mt-24"
      appearance="info"
      title={t("perpsAccountBanner.title")}
      description={t("perpsAccountBanner.description")}
      primaryAction={
        <Button appearance="gray" size="sm" onClick={onOpenPerps}>
          {t("perpsAccountBanner.cta")}
        </Button>
      }
      data-testid="perps-account-banner"
    />
  );
}
