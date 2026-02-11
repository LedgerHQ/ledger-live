import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setPortfolioCards,
  setActionCards,
  setNotificationsCards,
} from "~/renderer/actions/dynamicContent";
import {
  portfolioContentCardSelector,
  actionContentCardSelector,
  notificationsContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import {
  PortfolioContentCard,
  ActionContentCard,
  NotificationContentCard,
  LocationContentCard,
} from "~/types/dynamicContent";

const generateNewPortfolioCard = (
  title: string,
  description: string,
  image: string,
  order?: number,
  url?: string,
  cta?: string,
  tag?: string,
): PortfolioContentCard => ({
  id: String(Date.now()),
  title,
  description,
  location: LocationContentCard.Portfolio,
  image,
  created: new Date(),
  order,
  isMock: true,
  url,
  cta,
  tag,
});

const generateNewActionCard = (
  title: string,
  description: string,
  image: string,
  mainCta: string,
  link: string,
  secondaryCta: string,
  order?: number,
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
  ) => {
    const newCard = generateNewPortfolioCard(title, description, image, order, url, cta, tag);
    dispatch(setPortfolioCards([...portfolioCards, newCard]));
  };

  const addLocalActionCard = (
    title: string,
    description: string,
    image: string,
    mainCta: string,
    link: string,
    secondaryCta: string,
    order?: number,
  ) => {
    const newCard = generateNewActionCard(
      title,
      description,
      image,
      mainCta,
      link,
      secondaryCta,
      order,
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

  const dismissLocalCards = () => {
    dispatch(setPortfolioCards([]));
    dispatch(setActionCards([]));
    dispatch(setNotificationsCards([]));
  };

  return { addLocalPortfolioCard, addLocalActionCard, addLocalNotificationCard, dismissLocalCards };
};
