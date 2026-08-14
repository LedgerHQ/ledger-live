import { useDispatch } from "LLD/hooks/redux";
import {
  setPortfolioCards,
  setBottomPortfolioCards,
  setActionCards,
  setNotificationsCards,
  setLocalCategoryCards,
  addLocalContentCards,
} from "~/renderer/actions/dynamicContent";
import {
  portfolioContentCardSelector,
  bottomPortfolioContentCardSelector,
  actionContentCardSelector,
  notificationsContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import {
  PortfolioContentCard,
  ActionContentCard,
  NotificationContentCard,
  LocationContentCard,
} from "~/types/dynamicContent";
import { useSelector } from "LLD/hooks/redux";
import {
  buildDefaultHardwareCarouselValues,
  buildHardwareCarouselDebugCards,
  buildRandomLedgerImageUrl,
  DEBUG_CARD_PREFIX,
  HARDWARE_CAROUSEL_SAMPLE_PRODUCTS,
  type HardwareCarouselBuilderValues,
} from "../hardwareCarouselDebug";

const generateNewPortfolioContentCard = (
  title: string,
  description: string,
  image: string,
  location: PortfolioContentCard["location"],
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

export const useGenerateLocalBraze = () => {
  const dispatch = useDispatch();

  const portfolioCards = useSelector(portfolioContentCardSelector);
  const bottomPortfolioCards = useSelector(bottomPortfolioContentCardSelector);
  const actionCards = useSelector(actionContentCardSelector);
  const notificationCards = useSelector(notificationsContentCardSelector);

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

  const addLocalHardwareCarouselCard = (values: HardwareCarouselBuilderValues) => {
    const cardId = `${DEBUG_CARD_PREFIX}-top-wallet-hardware-${Date.now()}`;
    const { category, card } = buildHardwareCarouselDebugCards(values, cardId);
    dispatch(addLocalContentCards({ category, cards: [card] }));
  };

  const seedHardwareCarouselSample = () => {
    const baseTimestamp = Date.now();
    const categoryTitle = "Touchscreen offers";
    HARDWARE_CAROUSEL_SAMPLE_PRODUCTS.forEach((sample, index) => {
      const values: HardwareCarouselBuilderValues = {
        ...buildDefaultHardwareCarouselValues(),
        categoryTitle,
        productTitle: sample.productTitle,
        subDescription: sample.subDescription,
        tag: sample.tag,
        mediaUrl: sample.mediaUrl,
        order: String(index),
      };
      const cardId = `${DEBUG_CARD_PREFIX}-top-wallet-hardware-${baseTimestamp}-${index}`;
      const { category, card } = buildHardwareCarouselDebugCards(values, cardId);
      dispatch(addLocalContentCards({ category, cards: [card] }));
    });
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
    addLocalHardwareCarouselCard,
    seedHardwareCarouselSample,
    dismissLocalCards,
  };
};
