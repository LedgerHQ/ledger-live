import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/types";
import {
  BrazeContentCard,
  AssetContentCard,
  Background,
  LearnContentCard,
  ContentCardLocation,
  NotificationContentCard,
  WalletContentCard,
  CategoryContentCard,
  ContentCardCommonProperties,
  ContentCardsType,
  HorizontalContentCard,
  ContentCardsLayout,
  VerticalContentCard,
  HeroContentCard,
  AllLocations,
  LandingPageStickyCtaContentCard,
  LandingPageUseCase,
} from "~/dynamicContent/types";

export const getMobileContentCards = (array: BrazeContentCard[]) =>
  array.filter(elem => !elem.extras.platform || elem.extras.platform === "mobile");

export const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

export const filterByType = (array: BrazeContentCard[], type: ContentCardsType) =>
  array.filter(elem => elem.extras.type === type);

export const compareCards = (a: ContentCardCommonProperties, b: ContentCardCommonProperties) => {
  if (a.order && !b.order) {
    return -1;
  }
  if (!a.order && b.order) {
    return 1;
  }
  if ((!a.order && !b.order) || a.order === b.order) {
    return b.createdAt - a.createdAt;
  }
  return (a.order || 0) - (b.order || 0);
};

export const filterCategoriesByLocation = (
  categories: CategoryContentCard[],
  locationId: AllLocations,
) => {
  const categoriesToDisplay = categories.filter(category => category.location === locationId);

  return categoriesToDisplay;
};

export const filterCardsThatHaveBeenDismissed = (
  cards: BrazeContentCard[],
  dismissedContentCardsIds: string[],
) => {
  const filteredCards = cards.filter(card => !dismissedContentCardsIds.includes(card.id));

  return filteredCards;
};

export const formatCategories = (
  categories: CategoryContentCard[],
  mobileCards: BrazeContentCard[],
) => {
  const categoriesSorted = categories.sort(compareCards);
  const categoriesWithCards = categoriesSorted.map(category => ({
    category,
    cards: mobileCards.filter(mobileCard => mobileCard.extras.categoryId === category.categoryId),
  }));
  const categoriesWithAtLeastOneCard = categoriesWithCards.filter(
    categoryWithCards => categoryWithCards.cards.length > 0,
  );

  return categoriesWithAtLeastOneCard;
};

export const mapAsCategoryContentCard = (card: BrazeContentCard): CategoryContentCard => ({
  id: card.id,
  categoryId: card.extras.id,
  location: card.extras.location as ContentCardLocation,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
  cardsLayout: card.extras.cardsLayout as ContentCardsLayout,
  cardsType: card.extras.cardsType as ContentCardsType,
  type: card.extras.type as ContentCardsType.category,
  title: card.extras.title,
  description: card.extras.description,
  link: card.extras.link,
  cta: card.extras.cta,
  isDismissable: Boolean(card.extras?.isDismissable === "true"),
  hasPagination: Boolean(card.extras?.hasPagination === "true"),
});

export const mapAsWalletContentCard = (card: BrazeContentCard): WalletContentCard => ({
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  location: ContentCardLocation.Wallet,
  image: card.extras.image,
  link: card.extras.link,
  background: Background[card.extras.background as Background] || Background.purple,
  viewed: card.viewed,
  createdAt: card.created,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
});

export const mapAsAssetContentCard = (card: BrazeContentCard): AssetContentCard => ({
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  location: ContentCardLocation.Asset,
  image: card.extras.image,
  link: card.extras.link,
  cta: card.extras.cta,
  assets: card.extras.assets ?? "",
  displayOnEveryAssets: Boolean(card.extras.displayOnEveryAssets) ?? false,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
});

export const mapAsLearnContentCard = (card: BrazeContentCard): LearnContentCard => ({
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  location: ContentCardLocation.Learn,
  image: card.extras.image,
  link: card.extras.link,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
});

export const mapAsNotificationContentCard = (card: BrazeContentCard): NotificationContentCard => ({
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  description: card.extras.description,
  location: ContentCardLocation.NotificationCenter,
  link: card.extras.link,
  cta: card.extras.cta,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
});

export const mapAsHorizontalContentCard = (card: BrazeContentCard): HorizontalContentCard => ({
  type: ContentCardsType.action,
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  description: card.extras.description,
  image: card.extras.image,
  link: card.extras.link,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
  gridWidthFactor: WidthFactor.Full,
});

const mapAsSquareContentCard = (
  card: BrazeContentCard,
  size: Size,
  type: ContentCardsType,
  carouselWidthFactor: WidthFactor,
  gridWidthFactor: WidthFactor,
): VerticalContentCard => ({
  type,
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  description: card.extras.description,
  image: card.extras.image,
  price: card.extras.subtitle,
  cta: card.extras.cta,
  size,
  link: card.extras.link,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
  carouselWidthFactor,
  gridWidthFactor,
  filledImage: Boolean(card.extras.filledImage),
});

export const mapAsHeroContentCard = (card: BrazeContentCard): HeroContentCard => ({
  type: ContentCardsType.hero,
  id: card.id,
  tag: card.extras.tag,
  title: card.extras.title,
  image: card.extras.image,
  cta: card.extras.cta,
  link: card.extras.link,
  createdAt: card.created,
  viewed: card.viewed,
  order: parseInt(card.extras.order) ? parseInt(card.extras.order) : undefined,
});

export const mapAsSmallSquareContentCard = (card: BrazeContentCard): VerticalContentCard =>
  mapAsSquareContentCard(
    card,
    "S",
    ContentCardsType.smallSquare,
    WidthFactor.Half,
    WidthFactor.Half,
  );

export const mapAsMediumSquareContentCard = (card: BrazeContentCard): VerticalContentCard =>
  mapAsSquareContentCard(
    card,
    "M",
    ContentCardsType.mediumSquare,
    WidthFactor.ThreeQuarters,
    WidthFactor.Half,
  );

export const mapAsBigSquareContentCard = (card: BrazeContentCard): VerticalContentCard =>
  mapAsSquareContentCard(card, "L", ContentCardsType.bigSquare, WidthFactor.Full, WidthFactor.Full);

export const mapAsLandingPageStickyCtaContentCard = (
  card: BrazeContentCard,
): LandingPageStickyCtaContentCard => ({
  id: card.id,
  cta: card.extras.cta,
  link: card.extras.link,
  createdAt: card.created,
  viewed: card.viewed,
  landingPage: card.extras.landingPage as LandingPageUseCase,
});
