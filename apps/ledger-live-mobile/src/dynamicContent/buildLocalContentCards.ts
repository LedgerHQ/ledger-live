import {
  Background,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  type BrazeContentCard,
  type CategoryContentCard,
  type WalletContentCard,
} from "./types";

const SAMPLE_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQec1piP0de4iTT4LlWAg_SSU8DRv12XEfqwQ&s";

const WALLET_CAROUSEL_MOCK_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1621761191319-6eefa01365c0?auto=format&fit=crop&w=1200&q=80";

function createBrazeLikeCard(
  id: string,
  categoryId: string,
  location: string,
  type: string,
  cardsLayout: string,
  cardsType: string,
  extras: Record<string, string>,
): BrazeContentCard {
  const now = Date.now();
  const card = {
    id,
    created: now,
    viewed: false,
    extras: {
      platform: "mobile",
      location,
      type,
      categoryId,
      id: categoryId,
      order: "0",
      cardsLayout,
      cardsType,
      ...extras,
    },
  };
  return card as unknown as BrazeContentCard;
}

export function buildSampleBanner(): {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
} {
  const ts = Date.now();
  const categoryId = `local-category-${ts}`;
  const category: CategoryContentCard = {
    id: `local-cat-${ts}`,
    categoryId,
    location: ContentCardLocation.TopWallet,
    createdAt: ts,
    viewed: false,
    order: 0,
    cardsLayout: ContentCardsLayout.unique,
    cardsType: ContentCardsType.hero,
    type: ContentCardsType.category,
    title: "Sample banner",
    description: "Local content card for testing without Braze.",
    cta: "Learn more",
    link: "https://www.ledger.com/",
  };

  const heroCard = createBrazeLikeCard(
    `local-hero-${ts}`,
    categoryId,
    ContentCardLocation.TopWallet,
    ContentCardsType.hero,
    ContentCardsLayout.unique,
    ContentCardsType.hero,
    {
      title: "Sample banner",
      secondaryText: "Local content card for testing without Braze.",
      image: SAMPLE_IMAGE,
      cta: "Learn more",
      link: "https://www.ledger.com/",
    },
  );

  return { category, cards: [heroCard] };
}

/** Braze action card layout for Portfolio: `ContentBanner` + Spot (icon) vs `MediaBanner` (image_background). */
export type SampleActionBannerVariant = "icon" | "imageBackground";

const ACTION_SAMPLE_ITEMS: {
  title: string;
  description: string;
  link: string;
  icon: string;
}[] = [
  {
    title: "Buy",
    description: "Buy crypto with card or bank transfer",
    link: "ledgerlive://buy",
    icon: "Plus",
  },
  {
    title: "Swap",
    description: "Exchange crypto in-app",
    link: "ledgerlive://swap",
    icon: "Dollar",
  },
  {
    title: "Stake",
    description: "Earn rewards on your assets",
    link: "ledgerlive://earn",
    icon: "Snow",
  },
];

function buildSampleActionCarouselCard(
  categoryId: string,
  variant: SampleActionBannerVariant,
  itemIndex: number,
  cardId: string,
): BrazeContentCard {
  const item = ACTION_SAMPLE_ITEMS[itemIndex % ACTION_SAMPLE_ITEMS.length];
  return createBrazeLikeCard(
    cardId,
    categoryId,
    ContentCardLocation.TopWallet,
    ContentCardsType.action,
    ContentCardsLayout.carousel,
    ContentCardsType.action,
    {
      title: item.title,
      description: item.description,
      link: item.link,
      order: String(itemIndex),
      ...(variant === "imageBackground" ? { image_background: SAMPLE_IMAGE } : { icon: item.icon }),
    },
  );
}

export function buildSampleActionCarouselInitial(variant: SampleActionBannerVariant = "icon"): {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
} {
  const ts = Date.now();
  const categoryId = `local-carousel-${ts}`;
  const category: CategoryContentCard = {
    id: `local-carousel-cat-${ts}`,
    categoryId,
    location: ContentCardLocation.TopWallet,
    createdAt: ts,
    viewed: false,
    order: 1,
    cardsLayout: ContentCardsLayout.carousel,
    cardsType: ContentCardsType.action,
    type: ContentCardsType.category,
    isDismissable: true,
  };

  const cards = [buildSampleActionCarouselCard(categoryId, variant, 0, `local-action-${ts}-0`)];
  return { category, cards };
}

export function buildSampleActionCarouselAppendCard(
  categoryId: string,
  variant: SampleActionBannerVariant,
  itemIndex: number,
): BrazeContentCard {
  const id = `local-action-${categoryId}-${itemIndex}-${Date.now()}`;
  return buildSampleActionCarouselCard(categoryId, variant, itemIndex, id);
}

/** Bottom Portfolio wallet carousel (`location: wallet`) — mock with Braze `picto` (crypto icon). */
export function buildSampleWalletCarouselPicto(): WalletContentCard[] {
  const ts = Date.now();
  return [
    {
      id: `local-wallet-carousel-picto-${ts}`,
      location: ContentCardLocation.Wallet,
      createdAt: ts,
      viewed: false,
      order: 0,
      picto: "bitcoin",
      title: "Sample bottom carousel (picto)",
      link: "https://www.ledger.com/",
      image: WALLET_CAROUSEL_MOCK_BACKGROUND_IMAGE,
      image_background: WALLET_CAROUSEL_MOCK_BACKGROUND_IMAGE,
      background: Background.purple,
      extras: { source: "local-debug" },
    },
  ];
}

/** Same placement, mock with `tag` only (no picto). */
export function buildSampleWalletCarouselTag(): WalletContentCard[] {
  const ts = Date.now();
  return [
    {
      id: `local-wallet-carousel-tag-${ts}`,
      location: ContentCardLocation.Wallet,
      createdAt: ts,
      viewed: false,
      order: 0,
      tag: "Discover",
      title: "Sample bottom carousel (tag)",
      link: "https://www.ledger.com/",
      image: WALLET_CAROUSEL_MOCK_BACKGROUND_IMAGE,
      image_background: WALLET_CAROUSEL_MOCK_BACKGROUND_IMAGE,
      background: Background.purple,
      extras: { source: "local-debug" },
    },
  ];
}
