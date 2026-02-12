import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-react/symbols";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import PageHeader from "LLD/components/PageHeader";
import { MIN_HEIGHT, MIN_WIDTH } from "~/config/windowConstants";
import CardWalletImage from "~/renderer/images/cardWallet.webp";
import {
  CARD_IMAGE_HEIGHT_VIEWPORT_RATIO,
  CARD_IMAGE_MAX_HEIGHT_PX,
  CARD_IMAGE_MAX_WIDTH_PX,
  CARD_IMAGE_WIDTH_VIEWPORT_RATIO,
  CARD_SUBTITLE_MAX_WIDTH_PX,
} from "./constants";
import TrackPage from "~/renderer/analytics/TrackPage";
import { CARD_TRACKING_PAGE_NAME } from "./constants";

const imageStyle = {
  maxHeight: `min(${CARD_IMAGE_MAX_HEIGHT_PX}px, ${MIN_HEIGHT * CARD_IMAGE_HEIGHT_VIEWPORT_RATIO}px)`,
  maxWidth: `min(${CARD_IMAGE_MAX_WIDTH_PX}px, ${MIN_WIDTH * CARD_IMAGE_WIDTH_VIEWPORT_RATIO}px)`,
} as const;

export interface CardViewProps {
  readonly goToExploreCards: () => void;
  readonly goToIHaveACard: () => void;
}

export const CardView = memo(function CardView({
  goToExploreCards,
  goToIHaveACard,
}: CardViewProps) {
  const { t } = useTranslation();

  return (
    <>
      <TrackPage category={CARD_TRACKING_PAGE_NAME} />
      <PageHeader title={t("card.title")} />

      <div className="my-24 flex flex-col gap-12">
        <span className="heading-1-semi-bold text-base">{t("card.spendYourCrypto")}</span>
        <span className="body-2 text-muted">{t("card.payDescription")}</span>
      </div>

      <div className="mb-24 flex gap-12">
        <Button appearance="base" size="sm" icon={Screens} onClick={goToExploreCards}>
          {t("card.exploreCards")}
        </Button>
        <Button appearance="transparent" size="sm" icon={CreditCard} onClick={goToIHaveACard}>
          {t("card.iAlreadyHaveACard")}
        </Button>
      </div>

      <Divider />

      <div className="mt-40 flex w-full min-w-0 flex-wrap items-center justify-between gap-24">
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <img
            src={CardWalletImage}
            alt={t("card.imageAlt")}
            className="max-w-full object-contain"
            style={imageStyle}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-20">
          <span className="heading-0-semi-bold text-base">{t("card.unlockLiquidity")}</span>
          <span
            className="heading-5 wrap-break-word text-base"
            style={{ maxWidth: CARD_SUBTITLE_MAX_WIDTH_PX }}
          >
            {t("card.exploreCryptoCardsDescription")}
          </span>
        </div>
      </div>
    </>
  );
});
