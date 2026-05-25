import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { resolveCampaignId } from "./campaignIds";
import type { GenericAwarenessModalDevFormState } from "./types";

export const buildContentCardFromForm = (
  form: GenericAwarenessModalDevFormState,
): GenericAwarenessModalContentCard => {
  const id = resolveCampaignId(form.layout, form.trigger);

  if (form.layout === "carousel") {
    return {
      layout: GenericAwarenessModalLayout.Carousel,
      id,
      data: form.slides.map(slide => ({
        title: slide.title,
        subtitle: slide.subtitle,
        imageUrl: slide.imageUrl,
        primaryButtonLabel: slide.primaryButtonLabel,
        primaryButtonLink: slide.primaryButtonLink,
      })),
    };
  }

  return {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id,
    title: form.title,
    subtitle: form.subtitle,
    imageUrl: form.imageUrl,
    primaryButtonLabel: form.primaryButtonLabel,
    primaryButtonLink: form.primaryButtonLink,
    secondaryButtonLabel: form.secondaryButtonLabel,
    secondaryButtonLink: form.secondaryButtonLink,
    items: form.items.map(item => ({
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
    })),
  };
};
