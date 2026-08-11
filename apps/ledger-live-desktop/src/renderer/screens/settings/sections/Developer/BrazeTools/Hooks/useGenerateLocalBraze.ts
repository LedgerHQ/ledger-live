import type { Card as BrazeCard } from "@braze/web-sdk";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { ALWAYS_ON_CATEGORY_ID } from "LLD/features/DynamicContent/utils/constants";
import {
  setPortfolioCards,
  setBottomPortfolioCards,
  setActionCards,
  setNotificationsCards,
  setLocalCategoryCards,
} from "~/renderer/actions/dynamicContent";
import {
  portfolioContentCardSelector,
  bottomPortfolioContentCardSelector,
  actionContentCardSelector,
  notificationsContentCardSelector,
  localCategoriesContentCardSelector,
  localCategoryChildCardsSelector,
} from "~/renderer/reducers/dynamicContent";
import {
  PortfolioContentCard,
  ActionContentCard,
  NotificationContentCard,
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";

const generateNewPortfolioContentCard = (
  title: string,
  description: string,
  image: string,
  location: LocationContentCard.Portfolio | LocationContentCard.BottomPortfolio,
  order?: number,
  url?: string,
  cta?: string,
  tag?: string,
  picto?: string,
  path?: string,
  icon?: string,
  image_background?: string,
): PortfolioContentCard => ({
  id: String(Date.now()),
  title,
  description,
  location,
  image,
  created: new Date(),
  order,
  isMock: true,
  url,
  cta,
  tag,
  picto,
  ...(path !== undefined && path !== "" && { path }),
  ...(icon !== undefined && icon !== "" && { icon }),
  ...(image_background !== undefined && image_background !== "" && { image_background }),
});

const generateNewActionCard = (
  title: string,
  description: string,
  image: string,
  mainCta: string,
  link: string,
  secondaryCta: string,
  order?: number,
  icon?: string,
  image_background?: string,
): ActionContentCard => ({
  id: String(Date.now()),
  title,
  description,
  location: LocationContentCard.Action,
  image,
  mainCta,
  link,
  secondaryCta,
  created: new Date(),
  order,
  isMock: true,
  ...(icon !== undefined && { icon }),
  ...(image_background !== undefined && image_background !== "" && { image_background }),
});

const generateNewNotificationCard = (
  title: string,
  description: string,
  cta: string,
  viewed: boolean,
  url?: string,
  path?: string,
  order?: number,
): NotificationContentCard => ({
  id: String(Date.now()),
  title,
  description,
  location: LocationContentCard.NotificationCenter,
  cta,
  viewed,
  url,
  path,
  created: new Date(),
  order,
  isMock: true,
});

const DEFAULT_CATEGORY_CHILD_COUNT = 3;

const generateNewCategoryCard = (
  categoryId: string,
  title: string,
  description: string,
  cta: string,
  order?: number,
): CategoryContentCard => ({
  id: `local-category-${categoryId}`,
  categoryId,
  title,
  description,
  cta,
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date(),
  order,
  isMock: true,
  isDismissable: true,
  hasPagination: true,
});

const generateNewCategoryChildCards = (
  categoryId: string,
  title: string,
  description: string,
  image: string,
  cta: string,
  path: string,
  count: number,
): BrazeCard[] =>
  Array.from({ length: count }, (_, index) => {
    const childIndex = index + 1;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      id: `local-category-child-${categoryId}-${childIndex}`,
      updated: new Date(),
      viewed: false,
      extras: {
        platform: "desktop",
        type: ContentCardsType.smallSquare,
        categoryId,
        title: `${title} ${childIndex}`,
        description,
        media: image,
        mediaType: "image",
        cta,
        link: path,
        order: String(childIndex),
      },
    } as unknown as BrazeCard;
  });

export const useGenerateLocalBraze = () => {
  const dispatch = useDispatch();

  const portfolioCards = useSelector(portfolioContentCardSelector);
  const bottomPortfolioCards = useSelector(bottomPortfolioContentCardSelector);
  const actionCards = useSelector(actionContentCardSelector);
  const notificationCards = useSelector(notificationsContentCardSelector);
  const localCategoriesCards = useSelector(localCategoriesContentCardSelector);
  const localCategoryChildCards = useSelector(localCategoryChildCardsSelector);

  const addLocalPortfolioCard = (
    title: string,
    description: string,
    image: string,
    order?: number,
    url?: string,
    cta?: string,
    tag?: string,
    picto?: string,
    path?: string,
    icon?: string,
    image_background?: string,
  ) => {
    const newCard = generateNewPortfolioContentCard(
      title,
      description,
      image,
      LocationContentCard.Portfolio,
      order,
      url,
      cta,
      tag,
      picto,
      path,
      icon,
      image_background,
    );
    dispatch(setPortfolioCards([...portfolioCards, newCard]));
  };

  const addLocalBottomPortfolioCard = (
    title: string,
    description: string,
    image: string,
    order?: number,
    url?: string,
    cta?: string,
    tag?: string,
    picto?: string,
    path?: string,
    icon?: string,
    image_background?: string,
  ) => {
    const newCard = generateNewPortfolioContentCard(
      title,
      description,
      image,
      LocationContentCard.BottomPortfolio,
      order,
      url,
      cta,
      tag,
      picto,
      path,
      icon,
      image_background,
    );
    dispatch(setBottomPortfolioCards([...bottomPortfolioCards, newCard]));
  };

  const addLocalActionCard = (
    title: string,
    description: string,
    image: string,
    mainCta: string,
    link: string,
    secondaryCta: string,
    order?: number,
    icon?: string,
    image_background?: string,
  ) => {
    const newCard = generateNewActionCard(
      title,
      description,
      image,
      mainCta,
      link,
      secondaryCta,
      order,
      icon,
      image_background,
    );
    dispatch(setActionCards([...actionCards, newCard]));
  };

  const addLocalNotificationCard = (
    title: string,
    description: string,
    cta: string,
    viewed: boolean,
    url?: string,
    path?: string,
    order?: number,
  ) => {
    const newCard = generateNewNotificationCard(title, description, cta, viewed, url, path, order);
    dispatch(setNotificationsCards([...notificationCards, newCard]));
  };

  const addLocalCategoryCard = (
    title: string,
    description: string,
    image: string,
    cta: string,
    path: string,
    order?: number,
  ) => {
    // The first category impersonates the real always-on campaign; the next ones need
    // their own id, otherwise the dedupe would drop them and nothing would show up.
    const categoryId =
      localCategoriesCards.length === 0 ? ALWAYS_ON_CATEGORY_ID : `local-${Date.now()}`;

    const category = generateNewCategoryCard(categoryId, title, description, cta, order);
    const childCards = generateNewCategoryChildCards(
      categoryId,
      title,
      description,
      image,
      cta,
      path,
      DEFAULT_CATEGORY_CHILD_COUNT,
    );
    dispatch(
      setLocalCategoryCards({
        categories: [...localCategoriesCards, category],
        childCards: [...localCategoryChildCards, ...childCards],
      }),
    );
  };

  const dismissLocalCards = () => {
    dispatch(setPortfolioCards([]));
    dispatch(setBottomPortfolioCards([]));
    dispatch(setActionCards([]));
    dispatch(setNotificationsCards([]));
    dispatch(setLocalCategoryCards({ categories: [], childCards: [] }));
  };

  return {
    addLocalPortfolioCard,
    addLocalBottomPortfolioCard,
    addLocalActionCard,
    addLocalNotificationCard,
    addLocalCategoryCard,
    dismissLocalCards,
  };
};
