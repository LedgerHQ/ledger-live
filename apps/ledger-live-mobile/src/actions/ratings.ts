import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";

export const setRatingsModalOpen = (isRatingsModalOpen: boolean) => ({
  type: "RATINGS_SET_MODAL_OPEN",
  isRatingsModalOpen,
});
export const setRatingsModalLocked = (isRatingsModalLocked: boolean) => ({
  type: "RATINGS_SET_MODAL_LOCKED",
  isRatingsModalLocked,
});
export const setRatingsCurrentRouteName = (currentRouteName?: string) => ({
  type: "RATINGS_SET_CURRENT_ROUTE_NAME",
  currentRouteName,
});
export const setRatingsHappyMoment = (happyMoment?: RatingsHappyMoment) => ({
  type: "RATINGS_SET_HAPPY_MOMENT",
  happyMoment,
});
export const setRatingsDataOfUser = (dataOfUser?: RatingsDataOfUser) => ({
  type: "RATINGS_SET_DATA_OF_USER",
  dataOfUser,
});
