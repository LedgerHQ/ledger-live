// @flow

export const setRatingsModalOpen = (isRatingsModalOpen: boolean) => ({
  type: "RATINGS_SET_MODAL_OPEN",
  isRatingsModalOpen,
});

export const setRatingsCurrentRoute = (currentRoute?: string) => ({
  type: "RATINGS_SET_CURRENT_ROUTE",
  currentRoute,
});

export const setRatingsHappyMoment = (happyMoment?: any) => ({
  type: "RATINGS_SET_HAPPY_MOMENT",
  happyMoment,
});

export const setRatingsDataOfUser = (dataOfUser?: any) => ({
  type: "RATINGS_SET_DATA_OF_USER",
  dataOfUser,
});
