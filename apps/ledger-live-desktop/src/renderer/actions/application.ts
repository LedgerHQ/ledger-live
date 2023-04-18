import { createAction } from "redux-actions";

export const unlock = createAction("APPLICATION_SET_DATA", () => ({
  isLocked: false,
  hasPassword: true,
}));
export const lock = createAction("APPLICATION_SET_DATA", () => ({
  isLocked: true,
  hasPassword: true,
}));
export const setHasPassword = createAction("APPLICATION_SET_DATA", (hasPassword?: boolean) => ({
  hasPassword,
}));
export const setDismissedCarousel = createAction(
  "APPLICATION_SET_DATA",
  (dismissedCarousel: boolean) => ({
    dismissedCarousel,
  }),
);
export const setOSDarkMode = createAction("APPLICATION_SET_DATA", (osDarkMode?: boolean) => ({
  osDarkMode,
}));
export const setNavigationLock = createAction(
  "APPLICATION_SET_DATA",
  (navigationLocked: boolean | undefined) => ({
    navigationLocked,
  }),
);
export const toggleSkeletonVisibility = createAction(
  "APPLICATION_SET_DATA",
  (alwaysShowSkeletons: boolean) => ({
    debug: {
      alwaysShowSkeletons,
    },
  }),
);
