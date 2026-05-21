import React, { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import Input from "~/renderer/components/Input";
import { openGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import {
  selectGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import { DeveloperToggleRow } from "../components/DeveloperToggleRow";
import {
  buildDevCarouselCard,
  buildDevFeatureIntroCard,
  parsePositiveCount,
  removeDevContentCards,
} from "./buildDevContentCards";
import { GENERIC_AWARENESS_MODAL_DEV_TOOL_COPY as copy } from "./copy";

type GenericAwarenessModalDevToolContentProps = {
  readonly expanded: boolean;
};

const DEFAULT_CTA_LINK = "https://www.ledger.com";
const DEFAULT_SLIDE_COUNT = "3";
const DEFAULT_ITEM_COUNT = "2";

const LabeledInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div className="flex flex-col gap-2">
    <span className="body-3 text-muted">{label}</span>
    <Input small style={{ maxWidth: 400 }} type={type} value={value} onChange={onChange} />
  </div>
);

const formatCardLabel = (card: GenericAwarenessModalContentCard) => {
  const layoutLabel =
    card.layout === GenericAwarenessModalLayout.Carousel ? "carousel" : "featureIntro";
  const detail =
    card.layout === GenericAwarenessModalLayout.Carousel
      ? `${card.data.length} slides`
      : `${card.items.length} items`;
  return `${card.id} (${layoutLabel}, ${detail})`;
};

export const GenericAwarenessModalDevToolContent = ({
  expanded,
}: GenericAwarenessModalDevToolContentProps) => {
  const dispatch = useDispatch();
  const contentCards = useSelector(selectGenericAwarenessModalContentCards);

  const [carouselSlideCount, setCarouselSlideCount] = useState(DEFAULT_SLIDE_COUNT);
  const [carouselCtaLink, setCarouselCtaLink] = useState(DEFAULT_CTA_LINK);
  const [carouselCampaignId, setCarouselCampaignId] = useState("");
  const [carouselIsAppStart, setCarouselIsAppStart] = useState(false);

  const [featureIntroItemCount, setFeatureIntroItemCount] = useState(DEFAULT_ITEM_COUNT);
  const [featureIntroCtaLink, setFeatureIntroCtaLink] = useState(DEFAULT_CTA_LINK);
  const [featureIntroCampaignId, setFeatureIntroCampaignId] = useState("");
  const [featureIntroIsAppStart, setFeatureIntroIsAppStart] = useState(false);

  const [openCampaignId, setOpenCampaignId] = useState("");
  const devCardIdsRef = useRef<Set<string>>(new Set());

  const campaignOptions = useMemo(
    () => contentCards.map(card => ({ value: card.id, label: formatCardLabel(card) })),
    [contentCards],
  );

  const appendContentCard = useCallback(
    (card: GenericAwarenessModalContentCard) => {
      devCardIdsRef.current.add(card.id);
      dispatch(setGenericAwarenessModalContentCards([...contentCards, card]));
      setOpenCampaignId(card.id);
    },
    [contentCards, dispatch],
  );

  const handleAddCarousel = useCallback(() => {
    const card = buildDevCarouselCard({
      slideCount: parsePositiveCount(carouselSlideCount, 3),
      primaryButtonLink: carouselCtaLink.trim() || DEFAULT_CTA_LINK,
      isAppStart: carouselIsAppStart,
      campaignId: carouselCampaignId,
    });
    appendContentCard(card);
  }, [
    appendContentCard,
    carouselCampaignId,
    carouselCtaLink,
    carouselIsAppStart,
    carouselSlideCount,
  ]);

  const handleAddFeatureIntro = useCallback(() => {
    const card = buildDevFeatureIntroCard({
      itemCount: parsePositiveCount(featureIntroItemCount, 2),
      primaryButtonLink: featureIntroCtaLink.trim() || DEFAULT_CTA_LINK,
      isAppStart: featureIntroIsAppStart,
      campaignId: featureIntroCampaignId,
    });
    appendContentCard(card);
  }, [
    appendContentCard,
    featureIntroCampaignId,
    featureIntroCtaLink,
    featureIntroIsAppStart,
    featureIntroItemCount,
  ]);

  const handleOpenAppStart = useCallback(() => {
    dispatch(openGenericAwarenessModalDialog());
  }, [dispatch]);

  const handleOpenByCampaignId = useCallback(() => {
    const campaignId = openCampaignId.trim();
    if (!campaignId) return;
    dispatch(openGenericAwarenessModalDialog({ campaignId }));
  }, [dispatch, openCampaignId]);

  const handleRemoveCreatedCards = useCallback(() => {
    const nextCards = removeDevContentCards(contentCards, devCardIdsRef.current);
    devCardIdsRef.current.clear();
    dispatch(setGenericAwarenessModalContentCards(nextCards));
    setOpenCampaignId("");
  }, [contentCards, dispatch]);

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-muted">{copy.description}</p>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <span className="body-2-semi-bold text-muted">{copy.carousel.title}</span>
            <Divider />
            <div className="flex flex-col gap-4">
              <LabeledInput
                label={copy.carousel.slideCount}
                type="number"
                value={carouselSlideCount}
                onChange={setCarouselSlideCount}
              />
              <LabeledInput
                label={copy.primaryCtaLink}
                value={carouselCtaLink}
                onChange={setCarouselCtaLink}
              />
              <LabeledInput
                label={copy.campaignId}
                value={carouselCampaignId}
                onChange={setCarouselCampaignId}
              />
              <DeveloperToggleRow
                name="generic-awareness-modal-carousel-app-start"
                label={copy.appStart}
                selected={carouselIsAppStart}
                onChange={() => setCarouselIsAppStart(prev => !prev)}
                description={copy.appStartDesc}
              />
              <Button appearance="accent" size="sm" onClick={handleAddCarousel}>
                {copy.carousel.add}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="body-2-semi-bold text-muted">{copy.featureIntro.title}</span>
            <Divider />
            <div className="flex flex-col gap-4">
              <LabeledInput
                label={copy.featureIntro.itemCount}
                type="number"
                value={featureIntroItemCount}
                onChange={setFeatureIntroItemCount}
              />
              <LabeledInput
                label={copy.primaryCtaLink}
                value={featureIntroCtaLink}
                onChange={setFeatureIntroCtaLink}
              />
              <LabeledInput
                label={copy.campaignId}
                value={featureIntroCampaignId}
                onChange={setFeatureIntroCampaignId}
              />
              <DeveloperToggleRow
                name="generic-awareness-modal-feature-intro-app-start"
                label={copy.appStart}
                selected={featureIntroIsAppStart}
                onChange={() => setFeatureIntroIsAppStart(prev => !prev)}
                description={copy.appStartDesc}
              />
              <Button appearance="accent" size="sm" onClick={handleAddFeatureIntro}>
                {copy.featureIntro.add}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="body-2-semi-bold text-muted">{copy.actions.title}</span>
            <Divider />
            <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
              {contentCards.length === 0 ? (
                <span className="body-3 text-muted">{copy.actions.empty}</span>
              ) : (
                contentCards.map(card => (
                  <span key={card.id} className="body-3">
                    {formatCardLabel(card)}
                  </span>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button appearance="accent" size="sm" onClick={handleOpenAppStart}>
                {copy.actions.openAppStart}
              </Button>
              <LabeledInput
                label={copy.actions.openCampaignId}
                value={openCampaignId}
                onChange={setOpenCampaignId}
              />
              <Button
                appearance="accent"
                size="sm"
                onClick={handleOpenByCampaignId}
                disabled={!openCampaignId.trim()}
              >
                {copy.actions.openById}
              </Button>
              <Button appearance="neutral" size="sm" onClick={handleRemoveCreatedCards}>
                {copy.actions.removeCreated}
              </Button>
            </div>
            {campaignOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaignOptions.map(option => (
                  <Button
                    key={option.value}
                    appearance="neutral"
                    size="sm"
                    onClick={() => setOpenCampaignId(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
