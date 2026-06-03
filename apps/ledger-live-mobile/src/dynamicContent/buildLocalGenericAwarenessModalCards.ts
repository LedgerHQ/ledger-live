import {
  GenericAwarenessModalLayout,
  processGenericAwarenessModalBrazeCards,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalMobileContentCard } from "~/reducers/genericAwarenessModal";

export type GenericAwarenessModalDebugLayout =
  | GenericAwarenessModalLayout.Carousel
  | GenericAwarenessModalLayout.FeatureIntro
  | GenericAwarenessModalLayout.Prompt;

export type GenericAwarenessModalDebugTrigger = "appStart" | "deeplink";

export type GenericAwarenessModalDebugItem = {
  title: string;
  subtitle: string;
  imageUrl?: string;
  primaryButtonLabel?: string;
  primaryButtonLink?: string;
  icon?: string;
};

export type GenericAwarenessModalDebugFormValues = {
  layout: GenericAwarenessModalDebugLayout;
  trigger: GenericAwarenessModalDebugTrigger;
  campaignId: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  items: GenericAwarenessModalDebugItem[];
};

type GenericAwarenessModalDebugBrazeCard = Parameters<
  typeof processGenericAwarenessModalBrazeCards
>[0][number];

const GENERIC_AWARENESS_LOCATION = "generic_awareness_modal";

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80";

const DEFAULT_APP_START_CAMPAIGN_IDS: Record<GenericAwarenessModalDebugLayout, string> = {
  [GenericAwarenessModalLayout.Carousel]: "app_start_debug_generic_awareness_carousel",
  [GenericAwarenessModalLayout.FeatureIntro]: "app_start_debug_generic_awareness_feature_intro",
  [GenericAwarenessModalLayout.Prompt]: "app_start_debug_generic_awareness_prompt",
};

const DEFAULT_DEEPLINK_CAMPAIGN_IDS: Record<GenericAwarenessModalDebugLayout, string> = {
  [GenericAwarenessModalLayout.Carousel]: "debug_generic_awareness_carousel",
  [GenericAwarenessModalLayout.FeatureIntro]: "debug_generic_awareness_feature_intro",
  [GenericAwarenessModalLayout.Prompt]: "debug_generic_awareness_prompt",
};

export function getDefaultGenericAwarenessModalCampaignId(
  layout: GenericAwarenessModalDebugLayout,
  trigger: GenericAwarenessModalDebugTrigger,
): string {
  return trigger === "appStart"
    ? DEFAULT_APP_START_CAMPAIGN_IDS[layout]
    : DEFAULT_DEEPLINK_CAMPAIGN_IDS[layout];
}

export function buildDefaultGenericAwarenessModalFormValues(): GenericAwarenessModalDebugFormValues {
  const layout = GenericAwarenessModalLayout.Carousel;
  const trigger: GenericAwarenessModalDebugTrigger = "appStart";

  return {
    layout,
    trigger,
    campaignId: getDefaultGenericAwarenessModalCampaignId(layout, trigger),
    title: "Secure your crypto journey",
    subtitle: "Discover how Ledger Wallet helps you stay in control.",
    imageUrl: DEFAULT_IMAGE_URL,
    primaryButtonLabel: "Continue",
    primaryButtonLink: "ledgerlive://buy/bitcoin",
    secondaryButtonLabel: "Maybe later",
    secondaryButtonLink: "ledgerlive://myledger",
    items: [
      {
        title: "Own your keys",
        subtitle: "Your private keys stay protected by your Ledger device.",
        imageUrl: DEFAULT_IMAGE_URL,
        primaryButtonLabel: "Open My Ledger",
        primaryButtonLink: "ledgerlive://myledger",
        icon: "Shield",
      },
      {
        title: "Explore safely",
        subtitle: "Review every transaction before you sign.",
        imageUrl: DEFAULT_IMAGE_URL,
        primaryButtonLabel: "Receive Bitcoin",
        primaryButtonLink: "ledgerlive://receive?currency=bitcoin",
        icon: "Eye",
      },
      {
        title: "Stay informed",
        subtitle: "Get timely product and security updates.",
        imageUrl: DEFAULT_IMAGE_URL,
        primaryButtonLabel: "Open Discover",
        primaryButtonLink: "ledgerlive://discover",
        icon: "Bell",
      },
    ],
  };
}

function buildCarouselBrazeCards({
  campaignId,
  items,
}: GenericAwarenessModalDebugFormValues): GenericAwarenessModalDebugBrazeCard[] {
  return items.map((item, index) => ({
    id: `${campaignId}-${index}`,
    extras: {
      campaignId,
      layout: GenericAwarenessModalLayout.Carousel,
      location: GENERIC_AWARENESS_LOCATION,
      index: String(index),
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      primaryButtonLabel: item.primaryButtonLabel,
      primaryButtonLink: item.primaryButtonLink,
    },
  }));
}

function buildFeatureIntroBrazeCards(
  values: GenericAwarenessModalDebugFormValues,
): GenericAwarenessModalDebugBrazeCard[] {
  const mainCard: GenericAwarenessModalDebugBrazeCard = {
    id: `${values.campaignId}-main`,
    extras: {
      campaignId: values.campaignId,
      layout: GenericAwarenessModalLayout.FeatureIntro,
      role: "main",
      location: GENERIC_AWARENESS_LOCATION,
      title: values.title,
      subtitle: values.subtitle,
      imageUrl: values.imageUrl,
      primaryButtonLabel: values.primaryButtonLabel,
      primaryButtonLink: values.primaryButtonLink,
      secondaryButtonLabel: values.secondaryButtonLabel,
      secondaryButtonLink: values.secondaryButtonLink,
    },
  };

  const itemCards = values.items.map((item, index) => ({
    id: `${values.campaignId}-item-${index}`,
    extras: {
      campaignId: values.campaignId,
      layout: GenericAwarenessModalLayout.FeatureIntro,
      role: "item",
      location: GENERIC_AWARENESS_LOCATION,
      index: String(index),
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
    },
  }));

  return [mainCard, ...itemCards];
}

function buildPromptBrazeCard(
  values: GenericAwarenessModalDebugFormValues,
): GenericAwarenessModalDebugBrazeCard[] {
  return [
    {
      id: values.campaignId,
      extras: {
        campaignId: values.campaignId,
        layout: GenericAwarenessModalLayout.Prompt,
        location: GENERIC_AWARENESS_LOCATION,
        title: values.title,
        subtitle: values.subtitle,
        imageUrl: values.imageUrl,
        primaryButtonLabel: values.primaryButtonLabel,
        primaryButtonLink: values.primaryButtonLink,
        secondaryButtonLabel: values.secondaryButtonLabel,
        secondaryButtonLink: values.secondaryButtonLink,
      },
    },
  ];
}

export function buildLocalGenericAwarenessModalBrazeCards(
  values: GenericAwarenessModalDebugFormValues,
): GenericAwarenessModalDebugBrazeCard[] {
  if (values.layout === GenericAwarenessModalLayout.Carousel) {
    return buildCarouselBrazeCards(values);
  }

  if (values.layout === GenericAwarenessModalLayout.Prompt) {
    return buildPromptBrazeCard(values);
  }

  return buildFeatureIntroBrazeCards(values);
}

export function buildLocalGenericAwarenessModalContentCards(
  values: GenericAwarenessModalDebugFormValues,
): GenericAwarenessModalMobileContentCard[] {
  return processGenericAwarenessModalBrazeCards(
    buildLocalGenericAwarenessModalBrazeCards(values),
  ).map(card => ({
    ...card,
    isLocal: true,
  }));
}
