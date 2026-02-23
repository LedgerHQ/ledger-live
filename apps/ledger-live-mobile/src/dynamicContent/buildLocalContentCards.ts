import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  type BrazeContentCard,
  type CategoryContentCard,
} from "./types";

const SAMPLE_IMAGE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQec1piP0de4iTT4LlWAg_SSU8DRv12XEfqwQ&s";

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

const ACTION_SAMPLES = [
  {
    title: "Buy",
    description: "Buy crypto with card or bank transfer",
    link: "ledgerlive://buy",
  },
  { title: "Swap", description: "Exchange crypto in-app", link: "ledgerlive://swap" },
  {
    title: "Stake",
    description: "Earn rewards on your assets",
    link: "ledgerlive://earn",
  },
];

export function buildSampleActionCarousel(): {
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
    title: "Sample actions",
  };

  const cards = ACTION_SAMPLES.map((item, index) =>
    createBrazeLikeCard(
      `local-action-${ts}-${index}`,
      categoryId,
      ContentCardLocation.TopWallet,
      ContentCardsType.action,
      ContentCardsLayout.carousel,
      ContentCardsType.action,
      {
        title: item.title,
        description: item.description,
        image: SAMPLE_IMAGE,
        link: item.link,
        order: String(index),
      },
    ),
  );

  return { category, cards };
}
