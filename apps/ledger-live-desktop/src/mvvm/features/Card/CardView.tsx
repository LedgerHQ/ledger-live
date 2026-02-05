import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "LLD/components/PageHeader";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-react/symbols";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";

export interface CardViewProps {
  goToExploreCards: () => void;
  goToIHaveACard: () => void;
}

export const CardView = memo(function CardView({
  goToExploreCards,
  goToIHaveACard,
}: CardViewProps) {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t("card.title")} />

      <div className="my-24 flex flex-col gap-12">
        <span className="heading-1-semi-bold text-base">{t("card.spendYourCrypto")}</span>
        <span className="body-2 text-muted">{t("card.payDescription")}</span>
      </div>

      <div className="mb-40 flex gap-12">
        <Button appearance="base" size="sm" icon={Screens} onClick={goToExploreCards}>
          {t("card.exploreCards")}
        </Button>
        <Button appearance="transparent" size="sm" icon={CreditCard} onClick={goToIHaveACard}>
          {t("card.iAlreadyHaveACard")}
        </Button>
      </div>

      <Divider />
    </>
  );
});
