import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { add, isBefore, parseISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { accountsWithPositiveBalanceCountSelector } from "../reducers/accounts";
import {
  ratingsModalOpenSelector,
  ratingsModalLockedSelector,
  ratingsCurrentRouteNameSelector,
  ratingsHappyMomentSelector,
  ratingsDataOfUserSelector,
} from "../reducers/ratings";
import {
  setRatingsModalOpen,
  setRatingsCurrentRouteName,
  setRatingsHappyMoment,
  setRatingsDataOfUser,
} from "../actions/ratings";
import { track } from "../analytics";
import { setNotificationsModalLocked } from "../actions/notifications";

export type RatingsHappyMoment = {
  timeout?: number;
  /** Name of the route that will trigger the rating flow */
  // eslint-disable-next-line camelcase
  route_name: string;
  /** In milliseconds, delay before triggering the rating flow */
  timer?: number;
  /** Whether the rating flow is triggered when entering or when leaving the screen */
  type?: "on_enter" | "on_leave";
};

export type RatingsDataOfUser = {
  /** Date of the first time the user oppened the app */
  appFirstStartDate?: Date;
  /** Number of times the user oppened the application */
  numberOfAppStarts?: number;
  /** Number of times the user oppened the application since the last time his app crashed */
  numberOfAppStartsSinceLastCrash?: number;
  /** If set, we will not prompt the rating flow again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Not now" cta from the Enjoy step of the ratings flow */
  alreadyClosedFromEnjoyStep?: boolean;
  /** Whether or not the user clicked on the "Not now" cta from the Init step of the ratings flow */
  alreadyClosedFromInitStep?: boolean;
  /** Whether or not the user already rated the app */
  alreadyRated?: boolean;
  /** If true, we will not prompt the rating flow again unless the user triggers it manually from the settings */
  doNotAskAgain?: boolean;
  /** "satisfied" if user clicked on the "Satisfied" cta in the ratings flow, "disappointed" if user clicked on the "I'm disappointed" in the ratings flow */
  satisfaction?: string;
};

const ratingsDataOfUserAsyncStorageKey = "ratingsDataOfUser";

async function getRatingsDataOfUserFromStorage() {
  const ratingsDataOfUser = await AsyncStorage.getItem(
    ratingsDataOfUserAsyncStorageKey,
  );
  if (!ratingsDataOfUser) return null;
  return JSON.parse(ratingsDataOfUser);
}

async function setRatingsDataOfUserInStorage(
  ratingsDataOfUser: RatingsDataOfUser,
) {
  await AsyncStorage.setItem(
    ratingsDataOfUserAsyncStorageKey,
    JSON.stringify(ratingsDataOfUser),
  );
}

const useRatings = () => {
  const ratingsFeature = useFeature("ratingsPrompt");

  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const isRatingsModalLocked = useSelector(ratingsModalLockedSelector);
  const ratingsOldRoute = useSelector(ratingsCurrentRouteNameSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);

  const accountsWithAmountCount = useSelector(
    accountsWithPositiveBalanceCountSelector,
  );

  const dispatch = useDispatch();

  const setRatingsModalOpenCallback = useCallback(
    isRatingsModalOpen => {
      if (!isRatingsModalOpen) {
        dispatch(setRatingsModalOpen(isRatingsModalOpen));
        dispatch(setNotificationsModalLocked(false));
      } else {
        dispatch(setRatingsModalOpen(isRatingsModalOpen));
        dispatch(setNotificationsModalLocked(true));
      }
    },
    [dispatch],
  );

  const areRatingsConditionsMet = useCallback(() => {
    if (!ratingsDataOfUser) return false;

    // criterias depending on last answer to the ratings flow
    if (ratingsDataOfUser.doNotAskAgain) return false;

    if (
      ratingsDataOfUser.dateOfNextAllowedRequest &&
      isBefore(
        Date.now(),
        typeof ratingsDataOfUser.dateOfNextAllowedRequest === "string"
          ? parseISO(ratingsDataOfUser.dateOfNextAllowedRequest)
          : ratingsDataOfUser.dateOfNextAllowedRequest,
      )
    ) {
      return false;
    }

    // minimum accounts number criteria
    const minimumAccountsNumber: number =
      ratingsFeature?.params?.conditions?.minimum_accounts_number;
    if (
      minimumAccountsNumber &&
      accountsWithAmountCount < minimumAccountsNumber
    ) {
      return false;
    }

    // minimum app start number criteria
    const minimumAppStartsNumber: number =
      ratingsFeature?.params?.conditions?.minimum_app_starts_number;
    if (
      ratingsDataOfUser.numberOfAppStarts &&
      ratingsDataOfUser.numberOfAppStarts < minimumAppStartsNumber
    ) {
      return false;
    }

    // duration since first app start long enough criteria
    const minimumDurationSinceAppFirstStart: Duration =
      ratingsFeature?.params?.conditions
        ?.minimum_duration_since_app_first_start;

    if (
      ratingsDataOfUser.appFirstStartDate &&
      isBefore(
        Date.now(),
        add(
          ratingsDataOfUser.appFirstStartDate,
          minimumDurationSinceAppFirstStart,
        ),
      )
    ) {
      return false;
    }

    // No crash in last session criteria
    const minimumNumberOfAppStartsSinceLastCrash: number =
      ratingsFeature?.params?.conditions
        ?.minimum_number_of_app_starts_since_last_crash;
    if (
      ratingsDataOfUser.numberOfAppStartsSinceLastCrash &&
      ratingsDataOfUser.numberOfAppStartsSinceLastCrash <
        minimumNumberOfAppStartsSinceLastCrash
    ) {
      return false;
    }

    return true;
  }, [
    ratingsDataOfUser,
    accountsWithAmountCount,
    ratingsFeature?.params?.conditions?.minimum_accounts_number,
    ratingsFeature?.params?.conditions?.minimum_app_starts_number,
    ratingsFeature?.params?.conditions?.minimum_duration_since_app_first_start,
    ratingsFeature?.params?.conditions
      ?.minimum_number_of_app_starts_since_last_crash,
  ]);

  const isHappyMomentTriggered = useCallback(
    (happyMoment: RatingsHappyMoment, ratingsNewRoute?: string) =>
      (happyMoment.type === "on_enter" &&
        happyMoment.route_name === ratingsNewRoute) ||
      (happyMoment.type === "on_leave" &&
        happyMoment.route_name === ratingsOldRoute),
    [ratingsOldRoute],
  );

  const onRatingsRouteChange = useCallback(
    (ratingsNewRoute, isOtherModalOpened = false) => {
      if (ratingsHappyMoment?.timeout) {
        dispatch(setNotificationsModalLocked(false));
        clearTimeout(ratingsHappyMoment?.timeout);
      }

      if (isOtherModalOpened || !areRatingsConditionsMet()) return false;

      for (const happyMoment of ratingsFeature?.params?.happy_moments) {
        if (isHappyMomentTriggered(happyMoment, ratingsNewRoute)) {
          dispatch(setNotificationsModalLocked(true));
          const timeout = setTimeout(() => {
            setRatingsModalOpenCallback(true);
          }, happyMoment.timer);
          dispatch(
            setRatingsHappyMoment({
              ...happyMoment,
              timeout,
            }),
          );
          dispatch(setRatingsCurrentRouteName(ratingsNewRoute));
          return true;
        }
      }
      dispatch(setRatingsCurrentRouteName(ratingsNewRoute));
      return false;
    },
    [
      areRatingsConditionsMet,
      ratingsHappyMoment?.timeout,
      dispatch,
      ratingsFeature?.params?.happy_moments,
      isHappyMomentTriggered,
      setRatingsModalOpenCallback,
    ],
  );

  const updateRatingsDataOfUserInStateAndStore = useCallback(
    ratingsDataOfUserUpdated => {
      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    },
    [dispatch],
  );

  const initRatingsData = useCallback(() => {
    getRatingsDataOfUserFromStorage().then(ratingsDataOfUser => {
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        appFirstStartDate: ratingsDataOfUser?.appFirstStartDate || Date.now(),
        numberOfAppStarts: (ratingsDataOfUser?.numberOfAppStarts ?? 0) + 1,
        numberOfAppStartsSinceLastCrash:
          (ratingsDataOfUser?.numberOfAppStartsSinceLastCrash ?? 0) + 1,
      });
    });
  }, [updateRatingsDataOfUserInStateAndStore]);

  const ratingsInitialStep = useMemo(
    () => (ratingsDataOfUser?.alreadyClosedFromEnjoyStep ? "enjoy" : "init"),
    [ratingsDataOfUser?.alreadyClosedFromEnjoyStep],
  );

  const handleSettingsRateApp = useCallback(() => {
    if (isRatingsModalLocked) return;

    dispatch(
      setRatingsHappyMoment({
        route_name: "Settings",
      }),
    );
    track("button_clicked", {
      flow: "review",
      button: "manual_review",
      source: "Settings",
      params: ratingsFeature?.params,
    });
    setRatingsModalOpenCallback(true);
  }, [
    isRatingsModalLocked,
    dispatch,
    ratingsFeature?.params,
    setRatingsModalOpenCallback,
  ]);

  const handleRatingsSetDateOfNextAllowedRequest = useCallback(
    (delay, additionalParams = {}) => {
      if (delay !== null && delay !== undefined) {
        const dateOfNextAllowedRequest: Date = add(Date.now(), delay);
        updateRatingsDataOfUserInStateAndStore({
          ...ratingsDataOfUser,
          dateOfNextAllowedRequest,
          ...additionalParams,
        });
      }
    },
    [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore],
  );

  const handleEnjoyNotNow = useCallback(() => {
    if (
      ratingsDataOfUser?.alreadyClosedFromEnjoyStep ||
      ratingsDataOfUser?.alreadyClosedFromInitStep
    ) {
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        doNotAskAgain: true,
        alreadyClosedFromEnjoyStep: false,
      });
    } else {
      handleRatingsSetDateOfNextAllowedRequest(
        ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
        {
          alreadyClosedFromEnjoyStep: true,
        },
      );
    }
  }, [
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsDataOfUser,
    ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
    updateRatingsDataOfUserInStateAndStore,
  ]);

  const handleInitNotNow = useCallback(() => {
    if (
      ratingsDataOfUser?.alreadyClosedFromEnjoyStep ||
      ratingsDataOfUser?.alreadyClosedFromInitStep
    ) {
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        doNotAskAgain: true,
      });
    } else {
      handleRatingsSetDateOfNextAllowedRequest(
        ratingsFeature?.params?.conditions?.not_now_delay,
        {
          alreadyClosedFromInitStep: true,
        },
      );
    }
  }, [
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsDataOfUser,
    ratingsFeature?.params?.conditions?.not_now_delay,
    updateRatingsDataOfUserInStateAndStore,
  ]);

  const handleGoToStore = useCallback(() => {
    updateRatingsDataOfUserInStateAndStore({
      ...ratingsDataOfUser,
      alreadyRated: true,
      doNotAskAgain: true,
    });
  }, [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore]);

  const handleSatisfied = useCallback(() => {
    updateRatingsDataOfUserInStateAndStore({
      ...ratingsDataOfUser,
      satisfaction: "satisfied",
    });
  }, [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore]);

  return {
    initRatingsData,
    onRatingsRouteChange,
    handleSettingsRateApp,
    handleRatingsSetDateOfNextAllowedRequest,
    handleEnjoyNotNow,
    handleInitNotNow,
    handleGoToStore,
    handleSatisfied,
    ratingsFeatureParams: ratingsFeature?.params,
    ratingsInitialStep,
    isRatingsModalOpen,
    ratingsHappyMoment,
    setRatingsModalOpen: setRatingsModalOpenCallback,
  };
};

export default useRatings;
